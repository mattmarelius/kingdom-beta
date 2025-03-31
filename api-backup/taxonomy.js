export default function handler(req, res) {
    // Add CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*"); // Allow all origins (or specify allowed origins)
    res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  
    // Handle preflight OPTIONS request
    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }
  
    const { name } = req.query;
    if (!name) {
      return res.status(400).json({ error: "Name query parameter is required" });
    }
  
    const taxonomyData = {
      "Northern Cardinal": {
        kingdom: "Animalia",
        order: "Passeriformes",
        family: "Cardinalidae",
        genus: "Cardinalis",
        species: "Cardinalis cardinalis",
      },
      "Duskytail Grouper": {
        kingdom: "Animalia",
        order: "Perciformes",
        family: "Serranidae",
        genus: "Epinephelus",
        species: "Epinephelus bleekeri",
      },
    };
  
    const taxonomy = taxonomyData[name] || {};
    res.status(200).json(taxonomy);
  }