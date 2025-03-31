export default function handler(req, res) {
    const commonNames = [
      "Northern Cardinal",
      "Duskytail Grouper",
      "Atlantic Cod",
    ];
    res.status(200).json(commonNames);
  }