import { parseFasta } from "../core/alignment";

export const demoAlignment = parseFasta(
  `>human_HBA Hemoglobin alpha
MVLSPADKTNVKAAWGKVGAHAGEYGAEALERMFLSFPTTKTYFPHFDLSHGSAQVKGHG
>mouse_HBA Hemoglobin alpha
MVLSGEDKSNIKAAWGKIGGHGAEYGAEALERMFASFPTTKTYFPHFDVSHGSAQVKGHG
>zebrafish_HBA Hemoglobin alpha
MSLTKDKAAVKAAWGKVGGHAAEYGAEALERMFLSFPTTKTYFPHFDLSHGSAQVKAHG`,
  "Hemoglobin alpha — demo",
);

