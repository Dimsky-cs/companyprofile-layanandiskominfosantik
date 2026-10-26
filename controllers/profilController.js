const { db } = require("../config/database");
const {
  buildOrgTree,
  getTreeStats,
  flattenTreeWithHierarchy,
} = require("../helpers/treeHelper");

exports.getProfilPage = async (req, res) => {
  try {
    const [profilRows] = await db.query("SELECT * FROM profil_dinas LIMIT 1");
    const [allNodes] = await db.query(
      "SELECT * FROM struktur_organisasi ORDER BY parent_id ASC, urutan ASC, id ASC",
    );

    const orgTree = buildOrgTree(allNodes || []);
    const treeStats = getTreeStats(allNodes || []);
    const flatHierarchy = flattenTreeWithHierarchy(orgTree || []);

    let baganConfig = null;
    if (profilRows && profilRows[0] && profilRows[0].bagan_config) {
      try {
        baganConfig =
          typeof profilRows[0].bagan_config === "string"
            ? JSON.parse(profilRows[0].bagan_config)
            : profilRows[0].bagan_config;
      } catch (e) {
        baganConfig = null;
      }
    }

    res.render("pages/profil", {
      title: "Profil & Struktur Organisasi",
      currentPage: "profil",
      profil: profilRows[0] || {},
      baganConfig: baganConfig,
      allNodes: allNodes || [],
      orgTree: orgTree || [],
      treeStats: treeStats || {},
      flatHierarchy: flatHierarchy || [],
    });
  } catch (error) {
    console.error("Error memuat profil dinas:", error);
    res.status(500).send("Terjadi kesalahan memuat profil dinas.");
  }
};
