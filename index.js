const express = require('express');
const app = express();
const cors = require('cors');
app.use(cors());
const mongoose = require('mongoose');

// MongoDB connection string
const DB = "mongodb+srv://divyanshSharma:divyanshSharma@cluster0.qdqmptw.mongodb.net/store?retryWrites=true&w=majority";
mongoose.connect(DB)
    .then(() => {
        console.log("Connected to MongoDB");
    })
    .catch(error => {
        console.error("Error connecting to MongoDB:", error);
    });

// MongoDB Shop model
const Shop = mongoose.model('Shop', new mongoose.Schema({
    shop: { type: String, required: true, unique: true },
    accessToken: { type: String, required: true },
}));

// Route to serve the injected script for a specific shop
app.get('/serve-script/:shop', async (req, res) => {
    const shopName = req.params.shop;

    if (!shopName) {
        return res.status(400).send('Shop name is required');
    }

    const shopData = await Shop.findOne({ shop: shopName });

    if (!shopData) {
        return res.status(404).send('Shop not found');
    }

    const scriptContent = `
    document.addEventListener("DOMContentLoaded", async () => {
      const urlParts = window.location.pathname.split("/");
      const collectionHandle = urlParts[urlParts.length - 1];
      
      if (collectionHandle) {
        try {
          const response = await fetch("https://${shopData.shop}/admin/api/2024-04/custom_collections.json?handle=" + collectionHandle, {
            method: "GET",
            headers: {
              "X-Shopify-Access-Token": "${shopData.accessToken}",
              "Content-Type": "application/json",
            },
          });
          
          const data = await response.json();
          
          if (data.custom_collections && data.custom_collections.length > 0) {
            alert("Collection title: " + data.custom_collections[0].title);
          } else {
            alert("Collection not found.");
          }
        } catch (error) {
          console.error("Error fetching collection data:", error);
          alert("Failed to fetch collection data.");
        }
      }
    });
    `;

    res.setHeader('Content-Type', 'application/javascript');
    res.send(scriptContent);
});

// Route to check store registration and retrieve access token
app.get("/check-store", async (req, res) => {
    const { shop } = req.query;

    try {
        const store = await Shop.findOne({ shop });

        if (!store) {
            return res.status(404).json({ message: "Store not registered." });
        }

        res.json({ accessToken: store.accessToken });
    } catch (error) {
        console.error("Error retrieving store data:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// Route to serve the JSON-LD schema injection script with custom fields
app.get("/server-script.js", (req, res) => {
    res.set("Content-Type", "application/javascript");
    res.send(`
    const shop = window.location.hostname;

    async function insertCollectionSchema() {
      try {
        const tokenResponse = await fetch(\`https://collection-server-2w63.onrender.com/check-store?shop=\${shop}\`);
        const tokenData = await tokenResponse.json();

        if (tokenData && tokenData.accessToken) {
          const accessToken = tokenData.accessToken;
          const pathParts = window.location.pathname.split("/");

          if (pathParts[1] === "collections") {
            const collectionHandle = pathParts[2];

            if (collectionHandle) {
              const collectionResponse = await fetch(
                \`https://\${shop}/admin/api/2024-04/custom_collections.json?handle=\${collectionHandle}\`,
                {
                  method: "GET",
                  headers: {
                    "X-Shopify-Access-Token": accessToken,
                    "Content-Type": "application/json",
                  },
                }
              );
              
              if (!collectionResponse.ok) {
                throw new Error('Failed to fetch collection: ' + collectionResponse.statusText);
              }

              const collectionData = await collectionResponse.json();
              if (collectionData.custom_collections && collectionData.custom_collections.length > 0) {
                const collection = collectionData.custom_collections[0];
                insertSchema(collection);
              } else {
                console.warn("Collection not found.");
              }
            } else {
              console.warn("Collection handle not provided.");
            }
          } else {
            console.warn("Not on collections page.");
          }
        } else {
          console.warn("Access token not found for this shop.");
        }
      } catch (error) {
        console.error("Error fetching collection data:", error);
      }
    }

    function insertSchema(collection) {
      const schemaData = {
        "@context": "https://schema.org/",
        "@type": "Collection",
        "name": collection.title,
        "description": collection.body_html ? collection.body_html.replace(/<[^>]*>/g, "") : "",
        "url": window.location.href,
        "image": collection.image ? collection.image.src : null,
        "customField": "This is a custom field for collection", // Custom field for Collection
        "itemListElement": collection.products ? collection.products.map(product => ({
          "@type": "Product",
          "name": product.title,
          "image": product.images ? product.images.map(image => image.src) : [],
          "url": \`https://\${shop}/products/\${product.handle}\`,
          "customProductField": "Custom value for product", // Custom field for Product
          "offers": {
            "@type": "Offer",
            "priceCurrency": product.variants[0].currency,
            "price": product.variants[0].price,
            "itemCondition": "https://schema.org/NewCondition",
            "availability": product.variants[0].inventory_quantity > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          }
        })) : []
      };

      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.text = JSON.stringify(schemaData);
      document.head.appendChild(script);
      console.log("JSON-LD schema inserted for collection:", collection.title);
    }

    insertCollectionSchema();
    `);
});

// Server start-up
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
















// 18-10-2024
// const express = require('express');
// const app = express();
// const cors = require('cors');
// app.use(cors());
// const mongoose = require('mongoose');

// // MongoDB connection string
// const DB = "mongodb+srv://divyanshSharma:divyanshSharma@cluster0.qdqmptw.mongodb.net/store?retryWrites=true&w=majority";
// mongoose.connect(DB)
//     .then(() => {
//         console.log("Connected to MongoDB");
//     })
//     .catch(error => {
//         console.error("Error connecting to MongoDB:", error);
//     });

// // MongoDB Shop model
// const Shop = mongoose.model('Shop', new mongoose.Schema({
//     shop: { type: String, required: true, unique: true },
//     accessToken: { type: String, required: true },
// }));

// // Route to serve the injected script for a specific shop
// app.get('/serve-script/:shop', async (req, res) => {
//     const shopName = req.params.shop;

//     if (!shopName) {
//         return res.status(400).send('Shop name is required');
//     }

//     const shopData = await Shop.findOne({ shop: shopName });

//     if (!shopData) {
//         return res.status(404).send('Shop not found');
//     }

//     const scriptContent = `
//     document.addEventListener("DOMContentLoaded", async () => {
//       const urlParts = window.location.pathname.split("/");
//       const collectionHandle = urlParts[urlParts.length - 1];
      
//       if (collectionHandle) {
//         try {
//           const response = await fetch("https://${shopData.shop}/admin/api/2024-04/custom_collections.json?handle=" + collectionHandle, {
//             method: "GET",
//             headers: {
//               "X-Shopify-Access-Token": "${shopData.accessToken}",
//               "Content-Type": "application/json",
//             },
//           });
          
//           const data = await response.json();
          
//           if (data.custom_collections && data.custom_collections.length > 0) {
//             alert("Collection title: " + data.custom_collections[0].title);
//           } else {
//             alert("Collection not found.");
//           }
//         } catch (error) {
//           console.error("Error fetching collection data:", error);
//           alert("Failed to fetch collection data.");
//         }
//       }
//     });
//     `;

//     res.setHeader('Content-Type', 'application/javascript');
//     res.send(scriptContent);
// });

// // Route to check store registration and retrieve access token
// app.get("/check-store", async (req, res) => {
//     const { shop } = req.query;

//     try {
//         const store = await Shop.findOne({ shop });

//         if (!store) {
//             return res.status(404).json({ message: "Store not registered." });
//         }

//         res.json({ accessToken: store.accessToken });
//     } catch (error) {
//         console.error("Error retrieving store data:", error);
//         res.status(500).json({ message: "Internal Server Error" });
//     }
// });

// // Route to serve the JSON-LD schema injection script
// app.get("/server-script.js", (req, res) => {
//     res.set("Content-Type", "application/javascript");
//     res.send(`
//     const shop = window.location.hostname;

//     async function insertCollectionSchema() {
//       try {
//         const tokenResponse = await fetch(\`https://collection-server-2w63.onrender.com/check-store?shop=\${shop}\`);
//         const tokenData = await tokenResponse.json();

//         if (tokenData && tokenData.accessToken) {
//           const accessToken = tokenData.accessToken;
//           const pathParts = window.location.pathname.split("/");

//           if (pathParts[1] === "collections") {
//             const collectionHandle = pathParts[2];

//             if (collectionHandle) {
//               const collectionResponse = await fetch(
//                 \`https://\${shop}/admin/api/2024-04/custom_collections.json?handle=\${collectionHandle}\`,
//                 {
//                   method: "GET",
//                   headers: {
//                     "X-Shopify-Access-Token": accessToken,
//                     "Content-Type": "application/json",
//                   },
//                 }
//               );
              
//               if (!collectionResponse.ok) {
//                 throw new Error('Failed to fetch collection: ' + collectionResponse.statusText);
//               }

//               const collectionData = await collectionResponse.json();
//               if (collectionData.custom_collections && collectionData.custom_collections.length > 0) {
//                 const collection = collectionData.custom_collections[0];
//                 insertSchema(collection);
//               } else {
//                 console.warn("Collection not found.");
//               }
//             } else {
//               console.warn("Collection handle not provided.");
//             }
//           } else {
//             console.warn("Not on collections page.");
//           }
//         } else {
//           console.warn("Access token not found for this shop.");
//         }
//       } catch (error) {
//         console.error("Error fetching collection data:", error);
//       }
//     }

//     function insertSchema(collection) {
//       const schemaData = {
//         "@context": "https://schema.org/",
//         "@type": "Collection",
//         "name": collection.title,
//         "description": collection.body_html ? collection.body_html.replace(/<[^>]*>/g, "") : "",
//         "url": window.location.href,
//         "image": collection.image ? collection.image.src : null,
//         "itemListElement": collection.products ? collection.products.map(product => ({
//           "@type": "Product",
//           "name": product.title,
//           "abc2":"abc",
//           "image": product.images ? product.images.map(image => image.src) : [],
//           "url": \`https://\${shop}/products/\${product.handle}\`,
//           "offers": {
//             "@type": "Offer",
//             "priceCurrency": product.variants[0].currency,
//             "price": product.variants[0].price,
//             "itemCondition": "https://schema.org/NewCondition",
//             "availability": product.variants[0].inventory_quantity > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
//           }
//         })) : []
//       };

//       const script = document.createElement("script");
//       script.type = "application/ld+json";
//       script.text = JSON.stringify(schemaData);
//       document.head.appendChild(script);
//       console.log("JSON-LD schema inserted for collection:", collection.title);
//     }

//     insertCollectionSchema();
//     `);
// });

// // Server start-up
// const port = process.env.PORT || 3000;
// app.listen(port, () => {
//     console.log(`Server running on http://localhost:${port}`);
// });

























// const express = require('express');
// const app = express();
// const cors = require('cors');
// const mongoose = require('mongoose');

// app.use(cors());

// // MongoDB Connection
// const DB = "mongodb+srv://divyanshSharma:divyanshSharma@cluster0.qdqmptw.mongodb.net/store?retryWrites=true&w=majority";
// mongoose.connect(DB)
//     .then(() => {
//         console.log("Connected to MongoDB");
//     })
//     .catch(error => {
//         console.error("Error connecting to MongoDB:", error);
//     });

// // Mongoose Model
// const Shop = mongoose.model('Shop', new mongoose.Schema({
//     shop: { type: String, required: true, unique: true },
//     accessToken: { type: String, required: true },
// }));

// // Endpoint to serve the custom script
// app.get('/serve-script/:shop', async (req, res) => {
//     const shopName = req.params.shop;

//     if (!shopName) {
//         return res.status(400).send('Shop name is required');
//     }

//     const shopData = await Shop.findOne({ shop: shopName });
//     console.log('hello',shopData)
//     // res.send(shopData)
//     if (!shopData) {
//         return res.status(404).send('Shop not found');
//     }

//     const scriptContent = `
//     document.addEventListener("DOMContentLoaded", async () => {
//         const urlParts = window.location.pathname.split("/");
//         const collectionHandle = urlParts[urlParts.length - 1];

//         if (collectionHandle) {
//             try {
//                 const response = await fetch("https://${shopData.shop}/admin/api/2024-04/custom_collections.json?handle=" + collectionHandle, {
//                     method: "GET",
//                     headers: {
//                         "X-Shopify-Access-Token": "${shopData.accessToken}",
//                         "Content-Type": "application/json",
//                     },
//                 });

//                 const data = await response.json();

//                 if (data.custom_collections && data.custom_collections.length > 0) {
//                     alert("Collection title: " + data.custom_collections[0].title);
//                 } else {
//                     alert("Collection not found.");
//                 }
//             } catch (error) {
//                 console.error("Error fetching collection data:", error);
//                 alert("Failed to fetch collection data.");
//             }
//         }
//     });
//     `;

//     res.setHeader('Content-Type', 'application/javascript');
//     res.send(scriptContent);
// });

// // Endpoint to check the store and retrieve the access token
// app.get("/check-store", async (req, res) => {
//     const { shop } = req.query;

//     console.log("Requested shop:", shop); // Debugging log

//     try {
//         const store = await Shop.findOne({ shop });

//         if (!store) {
//             return res.status(404).json({ message: "Store not registered." });
//         }

//         console.log("Found store:", store); // Debugging log
//         res.json({ accessToken: store.accessToken });
//     } catch (error) {
//         console.error("Error retrieving store data:", error);
//         res.status(500).json({ message: "Internal Server Error" });
//     }
// });

// // Endpoint to serve the server script
// app.get("/server-script.js", (req, res) => {
//     res.set("Content-Type", "application/javascript");
//     res.send(`
//     const shop = window.location.hostname;

//     async function insertCollectionSchema() {
//         try {
//             const tokenResponse = await fetch(\`https://collection-server-2w63.onrender.com/check-store?shop=\${shop}\`);
//             if (!tokenResponse.ok) {
//                 throw new Error('Failed to retrieve access token: ' + tokenResponse.statusText);
//             }

//             const tokenData = await tokenResponse.json();
//             console.log("Access token data:", tokenData); // Debugging log

//             if (tokenData && tokenData.accessToken) {
//                 const accessToken = tokenData.accessToken;
//                 const pathParts = window.location.pathname.split("/");

//                 if (pathParts[1] === "collections") {
//                     const collectionHandle = pathParts[2];

//                     if (collectionHandle) {
//                         const collectionResponse = await fetch(
//                             \`https://\${shop}/admin/api/2024-04/custom_collections.json?handle=\${collectionHandle}\`,
//                             {
//                                 method: "GET",
//                                 headers: {
//                                     "X-Shopify-Access-Token": accessToken,
//                                     "Content-Type": "application/json",
//                                 },
//                             }
//                         );

//                         if (!collectionResponse.ok) {
//                             throw new Error('Failed to fetch collection: ' + collectionResponse.statusText);
//                         }

//                         const collectionData = await collectionResponse.json();
//                         if (collectionData.custom_collections && collectionData.custom_collections.length > 0) {
//                             const collection = collectionData.custom_collections[0];
//                             insertSchema(collection);
//                         } else {
//                             console.warn("Collection not found.");
//                         }
//                     } else {
//                         console.warn("Collection handle not provided.");
//                     }
//                 } else {
//                     console.warn("Not on collections page.");
//                 }
//             } else {
//                 console.warn("Access token not found for this shop.");
//             }
//         } catch (error) {
//             console.error("Error fetching collection data:", error);
//         }
//     }

//     function insertSchema(collection) {
//         const schemaData = {
//             "@context": "https://schema.org/",
//             "@type": "Collection",
//             "name": collection.title,
//             "description": collection.body_html.replace(/<[^>]*>/g, ""),
//             "url": window.location.href,
//             "image": collection.image ? collection.image.src : null,
//             "itemListElement": collection.products.map(product => ({
//                 "@type": "Product",
//                 "dfghju":"abcde",
//                 "name": product.title,
//                 "image": product.images.map(image => image.src),
//                 "url": \`https://\${shop}/products/\${product.handle}\`,
//                 "offers": {
//                     "@type": "Offer",
//                     "priceCurrency": product.variants[0].currency,
//                     "price": product.variants[0].price,
//                     "itemCondition": "https://schema.org/NewCondition",
//                     "availability": product.variants[0].inventory_quantity > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
//                 }
//             }))
//         };

//         const script = document.createElement("script");
//         script.type = "application/ld+json";
//         script.text = JSON.stringify(schemaData);
//         document.head.appendChild(script);
//         console.log("JSON-LD schema inserted for collection:", collection.title);
//     }

//     insertCollectionSchema();
//     `);
// });

// // Start the server
// const port = process.env.PORT || 3000;
// app.listen(port, () => {
//     console.log(`Server running on http://localhost:${port}`);
// });




















// const express = require('express');
// const app = express();
// const cors = require('cors');
// app.use(cors());
// const mongoose = require('mongoose');

// const DB = "mongodb+srv://divyanshSharma:divyanshSharma@cluster0.qdqmptw.mongodb.net/store?retryWrites=true&w=majority";
// mongoose.connect(DB)
//     .then(() => {
//         console.log("Connected to MongoDB");
//     })
//     .catch(error => {
//         console.error("Error connecting to MongoDB:", error);
//     });

// const Shop = mongoose.model('Shop', new mongoose.Schema({
//     shop: { type: String, required: true, unique: true },
//     accessToken: { type: String, required: true },
// }));

// app.get('/serve-script/:shop', async (req, res) => {
//     const shopName = req.params.shop;

//     if (!shopName) {
//         return res.status(400).send('Shop name is required');
//     }

//     const shopData = await Shop.findOne({ shop: shopName });

//     if (!shopData) {
//         return res.status(404).send('Shop not found');
//     }

//     const scriptContent = `
//     document.addEventListener("DOMContentLoaded", async () => {
//       const urlParts = window.location.pathname.split("/");
//       const collectionHandle = urlParts[urlParts.length - 1];
      
//       if (collectionHandle) {
//         try {
//           const response = await fetch("https://${shopData.shop}/admin/api/2024-04/custom_collections.json?handle=" + collectionHandle, {
//             method: "GET",
//             headers: {
//               "X-Shopify-Access-Token": "${shopData.accessToken}",
//               "Content-Type": "application/json",
//             },
//           });
          
//           const data = await response.json();
          
//           if (data.custom_collections && data.custom_collections.length > 0) {
//             alert("Collection title: " + data.custom_collections[0].title);
//           } else {
//             alert("Collection not found.");
//           }
//         } catch (error) {
//           console.error("Error fetching collection data:", error);
//           alert("Failed to fetch collection data.");
//         }
//       }
//     });
//     `;

//     res.setHeader('Content-Type', 'application/javascript');
//     res.send(scriptContent);
// });

// app.get("/check-store", async (req, res) => {
//     const { shop } = req.query;

//     try {
//         const store = await Shop.findOne({ shop });

//         if (!store) {
//             return res.status(404).json({ message: "Store not registered." });
//         }

//         res.json({ accessToken: store.accessToken });
//     } catch (error) {
//         console.error("Error retrieving store data:", error);
//         res.status(500).json({ message: "Internal Server Error" });
//     }
// });

// app.get("/server-script.js", (req, res) => {
//     res.set("Content-Type", "application/javascript");
//     res.send(`
//     const shop = window.location.hostname;

//     async function insertCollectionSchema() {
//       try {
//         const tokenResponse = await fetch(\`https://server-page-xo9v.onrender.com/check-store?shop=\${shop}\`);
//         const tokenData = await tokenResponse.json();

//         if (tokenData && tokenData.accessToken) {
//           const accessToken = tokenData.accessToken;
//           const pathParts = window.location.pathname.split("/");

//           if (pathParts[1] === "collections") {
//             const collectionHandle = pathParts[2];

//             if (collectionHandle) {
//               const collectionResponse = await fetch(
//                 \`https://\${shop}/admin/api/2024-04/custom_collections.json?handle=\${collectionHandle}\`,
//                 {
//                   method: "GET",
//                   headers: {
//                     "X-Shopify-Access-Token": accessToken,
//                     "Content-Type": "application/json",
//                   },
//                 }
//               );
              
//               if (!collectionResponse.ok) {
//                 throw new Error('Failed to fetch collection: ' + collectionResponse.statusText);
//               }

//               const collectionData = await collectionResponse.json();
//               if (collectionData.custom_collections && collectionData.custom_collections.length > 0) {
//                 const collection = collectionData.custom_collections[0];
//                 insertSchema(collection);
//               } else {
//                 console.warn("Collection not found.");
//               }
//             } else {
//               console.warn("Collection handle not provided.");
//             }
//           } else {
//             console.warn("Not on collections page.");
//           }
//         } else {
//           console.warn("Access token not found for this shop.");
//         }
//       } catch (error) {
//         console.error("Error fetching collection data:", error);
//       }
//     }

//     function insertSchema(collection) {
//       const schemaData = {
//         "@context": "https://schema.org/",
//         "@type": "Collection",
//         "name": collection.title,
//         "description": collection.body_html.replace(/<[^>]*>/g, ""),
//         "url": window.location.href,
//         "image": collection.image ? collection.image.src : null,
//         "itemListElement": collection.products.map(product => ({
//           "@type": "Product",
//           "name": product.title,
//           "image": product.images.map(image => image.src),
//           "url": \`https://\${shop}/products/\${product.handle}\`,
//           "offers": {
//             "@type": "Offer",
//             "priceCurrency": product.variants[0].currency,
//             "price": product.variants[0].price,
//             "itemCondition": "https://schema.org/NewCondition",
//             "availability": product.variants[0].inventory_quantity > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
//           }
//         }))
//       };

//       const script = document.createElement("script");
//       script.type = "application/ld+json";
//       script.text = JSON.stringify(schemaData);
//       document.head.appendChild(script);
//       console.log("JSON-LD schema inserted for collection:", collection.title);
//     }

//     insertCollectionSchema();
//     `);
// });

// const port = process.env.PORT || 3000;
// app.listen(port, () => {
//     console.log(`Server running on http://localhost:${port}`);
// });

