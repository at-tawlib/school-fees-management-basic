module.exports = {
  packagerConfig: {
    asar: true,
  },
  rebuildConfig: {},
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      config: {
        name: "School Fees Management",
        overwrite: true,
      },
    },
    {
      name: "@electron-forge/maker-zip",
      platforms: ["darwin", "linux"],
      config: {
        name: "School Fees Management",
        overwrite: true,
      },
    },
    {
      name: "@electron-forge/maker-deb",
      config: {
        name: "School Fees Management",
        overwrite: true,
      },
    },
    {
      name: "@electron-forge/maker-rpm",
      config: {
        name: "School Fees Management",
        overwrite: true,
      },
    },
    {
      name: "@electron-forge/maker-dmg",
      config: {
        name: "School Fees Management",
        overwrite: true,
      },
    },
  ],
};
