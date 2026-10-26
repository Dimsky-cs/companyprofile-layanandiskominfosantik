/**
 * ============================================================================
 * ULTRA DINAMIS TREE HELPER ENGINE
 * ============================================================================
 * Mengimplementasikan 5 Komponen Utama Tree dalam Struktur Organisasi:
 * 1. Root (Akar)      : Posisi teratas / pimpinan tertinggi (parent_id = null)
 * 2. Parent (Orang Tua): Node yang memiliki bawahan langsung (children.length > 0)
 * 3. Child (Anak)     : Node bawahan yang terhubung langsung di bawah parent
 * 4. Sibling (Saudara): Node yang memiliki parent atau atasan yang sama (level sama)
 * 5. Leaf (Daun)      : Node posisi paling bawah yang tidak memiliki bawahan lagi (children.length = 0)
 * ============================================================================
 */

/**
 * Membangun struktur pohon hierarki lengkap dari daftar flat database
 * Mendukung kedalaman sembarang (N-Level Depth), multi-root, dan urutan sibling presisi.
 *
 * @param {Array<Object>} rows - Data mentah dari tabel struktur_organisasi
 * @returns {Array<Object>} - Array tree roots dengan metadata lengkap tiap node
 */
function buildOrgTree(rows) {
  if (!rows || !Array.isArray(rows) || rows.length === 0) {
    return [];
  }

  // 1. Inisialisasi Map node dan clone data
  const nodeMap = new Map();
  rows.forEach((row) => {
    const parentId =
      row.parent_id !== null && row.parent_id !== undefined && row.parent_id !== ""
        ? Number(row.parent_id)
        : null;

    nodeMap.set(row.id, {
      id: Number(row.id),
      parent_id: parentId,
      jabatan: (row.jabatan || "").trim(),
      nama_pejabat: (row.nama_pejabat || "").trim(),
      tipe_posisi: (row.tipe_posisi || "LINE_BIDANG").trim(),
      urutan: row.urutan !== undefined && row.urutan !== null ? Number(row.urutan) : 1,
      created_at: row.created_at,
      updated_at: row.updated_at,
      children: [],

      // 5 Komponen Tree Flag
      isRoot: false,
      isParent: false,
      isChild: false,
      isLeaf: false,

      // Metadata Navigasi & Posisi
      level: 0,
      depth: 0,
      roleKey: "LEAF", // 'ROOT' | 'PARENT' | 'LEAF' | 'CHILD'
      roleLabel: "Leaf (Daun)",
      roleDescription: "Posisi pelaksana yang tidak memiliki bawahan lagi.",
      badgeClass: "badge-leaf",

      // Sibling & Bawahan
      siblingsCount: 0,
      siblingsList: [],
      subordinatesCount: 0,
      directChildrenCount: 0,

      // Jalur Ancestor & Induk
      path: [],
      parentJabatan: null,
      parentPejabat: null,
    });
  });

  // 2. Hubungkan child ke parent masing-masing
  const treeRoots = [];
  nodeMap.forEach((node) => {
    if (node.parent_id !== null && nodeMap.has(node.parent_id)) {
      const parent = nodeMap.get(node.parent_id);
      node.parentJabatan = parent.jabatan;
      node.parentPejabat = parent.nama_pejabat;
      parent.children.push(node);
    } else {
      treeRoots.push(node);
    }
  });

  // 3. Urutkan anak-anak (siblings) secara deterministik: urutan ASC, lalu id ASC
  nodeMap.forEach((node) => {
    node.children.sort((a, b) => a.urutan - b.urutan || a.id - b.id);
    node.directChildrenCount = node.children.length;
  });
  treeRoots.sort((a, b) => a.urutan - b.urutan || a.id - b.id);

  // 4. Proses Rekursif: Level, Path, Role Komponen, dan Jumlah Bawahan
  function processNode(node, currentLevel, ancestorPath) {
    node.level = currentLevel;
    node.depth = currentLevel;
    node.path = [...ancestorPath, node.jabatan];

    node.isRoot = node.parent_id === null;
    node.isParent = node.children.length > 0;
    node.isChild = node.parent_id !== null;
    node.isLeaf = node.children.length === 0;

    // Klasifikasi 5 Komponen Utama SOTK
    if (node.isRoot) {
      node.roleKey = "ROOT";
      node.roleLabel = "Root (Akar / Pimpinan Tertinggi)";
      node.roleDescription =
        "Posisi pimpinan teratas yang tidak memiliki atasan langsung di dalam bagan.";
      node.badgeClass = "badge-root";
    } else if (node.isParent) {
      node.roleKey = "PARENT";
      node.roleLabel = "Parent (Orang Tua / Atasan Langsung)";
      node.roleDescription = `Node atasan yang mengoordinasikan ${node.children.length} sub-jabatan / unit kerja.`;
      node.badgeClass = "badge-parent";
    } else {
      node.roleKey = "LEAF";
      node.roleLabel = "Leaf (Daun / Posisi Pelaksana)";
      node.roleDescription =
        "Posisi ujung hierarki pelaksana teknis kegiatan kedinasan.";
      node.badgeClass = "badge-leaf";
    }

    // Rekursif untuk seluruh child node
    let totalSubordinates = 0;
    node.children.forEach((child) => {
      // Sibling data untuk child
      child.siblingsCount = node.children.length - 1;
      child.siblingsList = node.children
        .filter((s) => s.id !== child.id)
        .map((s) => ({ id: s.id, jabatan: s.jabatan, nama_pejabat: s.nama_pejabat }));

      processNode(child, currentLevel + 1, node.path);
      totalSubordinates += 1 + child.subordinatesCount;
    });

    node.subordinatesCount = totalSubordinates;
  }

  // Jalankan DFS untuk seluruh root yang ada
  treeRoots.forEach((rootNode) => {
    rootNode.siblingsCount = treeRoots.length - 1;
    rootNode.siblingsList = treeRoots
      .filter((s) => s.id !== rootNode.id)
      .map((s) => ({ id: s.id, jabatan: s.jabatan, nama_pejabat: s.nama_pejabat }));

    processNode(rootNode, 0, []);
  });

  return treeRoots;
}

/**
 * Meratakan pohon hierarki menjadi array datar dengan prefiks pohon (├──, └──)
 * Sangat berguna untuk `<select>` dropdown atasan dan tampilan tabel hierarkis terurut.
 *
 * @param {Array<Object>} treeRoots - Hasil dari buildOrgTree()
 * @returns {Array<Object>} - Array terurut pre-order (DFS) dengan string indentasi
 */
function flattenTreeWithHierarchy(treeRoots) {
  if (!treeRoots || !Array.isArray(treeRoots)) return [];
  const result = [];

  function dfs(nodes, currentPrefix) {
    nodes.forEach((node, idx) => {
      const isLast = idx === nodes.length - 1;
      const connector = isLast ? "└── " : "├── ";
      const indentStr = node.level === 0 ? "👑 " : currentPrefix + connector;
      const childPrefix =
        node.level === 0 ? "" : currentPrefix + (isLast ? "    " : "│   ");

      const labelRole = node.isRoot
        ? "ROOT"
        : node.isParent
        ? `PARENT (${node.children.length} sub-jabatan)`
        : "LEAF";

      result.push({
        ...node,
        treePrefix: indentStr,
        displayLabel: `${indentStr}${node.jabatan}${
          node.nama_pejabat ? " — " + node.nama_pejabat : ""
        } [${labelRole}]`,
        shortLabel: `${indentStr}${node.jabatan}`,
      });

      if (node.children && node.children.length > 0) {
        dfs(node.children, childPrefix);
      }
    });
  }

  dfs(treeRoots, "");
  return result;
}

/**
 * Validasi Siklus Melingkar (Cycle Prevention)
 * Mencegah sebuah node memilih dirinya sendiri atau keturunannya sebagai parent_id baru.
 *
 * @param {Array<Object>} rows - Seluruh baris dari database
 * @param {number|string} nodeId - ID node yang sedang diedit
 * @param {number|string|null} newParentId - ID parent tujuan
 * @returns {{ valid: boolean, message?: string }}
 */
function validateParent(rows, nodeId, newParentId) {
  if (!newParentId || newParentId === "" || newParentId === "0") {
    return { valid: true }; // Menjadi Root selalu aman
  }

  const nId = Number(nodeId);
  const pId = Number(newParentId);

  if (nId === pId) {
    return {
      valid: false,
      message: "Jabatan tidak dapat menjadi atasan untuk dirinya sendiri.",
    };
  }

  const nodeMap = new Map();
  rows.forEach((r) => nodeMap.set(Number(r.id), r));

  // Telusuri rantai parent dari target ke atas (ancestor check)
  let current = nodeMap.get(pId);
  while (current) {
    if (Number(current.id) === nId) {
      return {
        valid: false,
        message:
          "Siklus melingkar tidak diizinkan: Anda tidak dapat memilih sub-jabatan di bawahnya sebagai atasan.",
      };
    }
    current =
      current.parent_id !== null && current.parent_id !== undefined
        ? nodeMap.get(Number(current.parent_id))
        : null;
  }

  return { valid: true };
}

/**
 * Menghitung Statistik Struktur Organisasi (Komponen Metrics)
 *
 * @param {Array<Object>} rows - Data mentah struktur_organisasi
 * @returns {Object} - Ringkasan statistik pohon
 */
function getTreeStats(rows) {
  if (!rows || !Array.isArray(rows) || rows.length === 0) {
    return {
      totalNodes: 0,
      totalRoots: 0,
      totalParents: 0,
      totalLeaves: 0,
      maxDepth: 0,
    };
  }

  const tree = buildOrgTree(rows);
  let maxDepth = 0;
  let totalRoots = 0;
  let totalParents = 0;
  let totalLeaves = 0;

  function countRecursive(nodes) {
    nodes.forEach((n) => {
      if (n.level > maxDepth) maxDepth = n.level;
      if (n.isRoot) totalRoots++;
      if (n.isParent) totalParents++;
      if (n.isLeaf) totalLeaves++;
      if (n.children && n.children.length > 0) {
        countRecursive(n.children);
      }
    });
  }

  countRecursive(tree);

  return {
    totalNodes: rows.length,
    totalRoots,
    totalParents,
    totalLeaves,
    maxDepth: maxDepth + 1, // 1-indexed (misal: 3 Tingkat Hierarki)
  };
}

module.exports = {
  buildOrgTree,
  flattenTreeWithHierarchy,
  validateParent,
  getTreeStats,
};
