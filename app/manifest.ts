import type { MetadataRoute } from "next";

/** Makes the site installable to a phone home screen. The tracker is used at a
 *  table on someone's phone, and a standalone launcher beats hunting for a tab. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Beta Beer Dye League",
    short_name: "BBDL",
    description: "League standings, stats, and the live game tracker.",
    start_url: "/dashboard",
    display: "standalone",
    orientation: "portrait",
    background_color: "#131f3d",
    theme_color: "#131f3d",
    icons: [
      { src: "/images/logo/BBDL_logo_single_128.png", sizes: "128x128", type: "image/png" },
      { src: "/images/logo/BBDL_logo_single_256.png", sizes: "256x256", type: "image/png" },
      {
        src: "/images/logo/BBDL_logo_single_512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
