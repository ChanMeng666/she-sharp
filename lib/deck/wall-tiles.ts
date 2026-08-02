/**
 * The archive wall.
 *
 * 118 photographs from twelve years of She Sharp events, used as texture rather
 * than as pictures: tiled, duotoned, and read as a mass. No single frame here is
 * a good photograph — they are group shots in fluorescent-lit meeting rooms with
 * no negative space, and that is precisely the point. What is worth looking at is
 * that there are so many of them, that they run from 2014 to 2026, and that every
 * one of them is a room that filled up.
 *
 * These are 520px WebP renditions, generated from the originals under
 * img/curated, img/gallery and img/scraped/photos. At source resolution one wall
 * slide cost about 31 MB of transfer and a gigabyte of decoded bitmap — a
 * 4898x3265 photograph drawn into a tile 259px wide — which a venue laptop does
 * not survive. Nothing in a wall is ever looked at as a picture, so the full
 * set is now ~2855 KB.
 *
 * Selection: landscape, de-duplicated across the three pools, posters,
 * screenshots and studio headshots excluded, and mean luminance clamped to
 * 47–150 so no single tile blows out or dies under the duotone.
 * Every path is checked by scripts/verify-image-paths.ts in CI.
 */
export const wallTiles: string[] = [
  "/img/wall/about-1.webp",
  "/img/wall/about-3.webp",
  "/img/wall/67db49b4151440dc4f671603-img-3264-2203329f.webp",
  "/img/wall/about-4.webp",
  "/img/wall/about-5.webp",
  "/img/wall/6554716d06edac9c61fc955f-38001550-1015578832099351-96368135.webp",
  "/img/wall/6562c48845033320605cf808-163525519-101585829729085-ca657ab8.webp",
  "/img/wall/6562b6287688a3e4760e4772-180626882-101586735591735-17cc9503.webp",
  "/img/wall/64c267164a9b193611121669-20230725192413-img-6500-27d4896b.webp",
  "/img/wall/64c2671964b91d6bd06bbf8a-20230725194201-img-6546-85afc53a.webp",
  "/img/wall/64ec5a06f3b88c6a60200d4d-20230824183646-img-6892-c4f275c3.webp",
  "/img/wall/650cca0fb1bbe26b910365e6-20230920091437-img-7995.webp",
  "/img/wall/650cca442bc2239222f97469-20230920075347-img-7597.webp",
  "/img/wall/650cca44383f686adb430788-20230920085103-img-7850.webp",
  "/img/wall/650cca443c6709f78251a927-20230920083609-img-7796.webp",
  "/img/wall/650cca444beb5604bc9bb3ee-20230920092902-img-8017.webp",
  "/img/wall/650cca44c35a51b2c7856ac3-20230920090621-img-7945.webp",
  "/img/wall/650cca44f7099a17d83750bb-20230920073520-img-7569.webp",
  "/img/wall/65471acd33f3f73de074f5d9-20231103153143-img-8021-191abab5.webp",
  "/img/wall/65471b64bf60ab2d04743553-20231103161813-img-8079-da8b489f.webp",
  "/img/wall/654b2ce92f6435d5f3ce7938-28947377-1015549049578851-1882c5f1.webp",
  "/img/wall/654b30aacf7202fb42aa88df-29063956-10155498141678519-29563499.webp",
  "/img/wall/65546481c859ae8f34bf1e90-hero.webp",
  "/img/wall/655d0ddb8153550f70d7db1b-design-thinkinh-hero.webp",
  "/img/wall/65645d5017f1224a49ed0d8f-11894393-10154551246968504-20994183.webp",
  "/img/wall/65645fa76b5eb360c5d9d751-12029660-10154707074788504-87185196.webp",
  "/img/wall/65ba0798b7750e7eb959843c-16836256-10154372570468519-63320266.webp",
  "/img/wall/6562c48c80f3c207d7349233-163781020-101585829729785-2bd80ade.webp",
  "/img/wall/women-in-ai-for-social-good-group-photo.webp",
  "/img/wall/6562ce4680f3c207d73a8691-127658859-101583021763985-7d4b9fb0.webp",
  "/img/wall/6554712fce744f2e9788d715-nyriadlanding.webp",
  "/img/wall/she-pushpay-group-photo.webp",
  "/img/wall/6541a692bf46bad1b9c6df42-img-2047-2020651e.webp",
  "/img/wall/65ee994d-iwd2024-group-woolworths.webp",
  "/img/wall/2022-ai-enviro-hack-group-photo.webp",
  "/img/wall/69ae758e75cb901b6270b2d2-lss02450-editwebres-original.webp",
  "/img/wall/about-2.webp",
  "/img/wall/65546b010427d6b98fd5b970-gridhero.webp",
  "/img/wall/65546be80427d6b98fd6973a-36274720-1015571515038351-0fea4a4d.webp",
  "/img/wall/65546be8d29332fb2ff7963b-36227157-1015571515167851-05724d72.webp",
  "/img/wall/6555341ed1504da5026e21a3-21-8f33c553.webp",
  "/img/wall/6555341f1e9e5e9cbd760138-2-bdd71e1a.webp",
  "/img/wall/655d0ffd5852c1e69ae266e8-36339977-1015571514811351-0b2c402f.webp",
  "/img/wall/6562e7f348eaaa2bd3bc4554-2-972464ef.webp",
  "/img/wall/6562e7f45624a073cf672898-4-ac4acbb0.webp",
  "/img/wall/6562eb262e529075a4bc72db-g-2-a9b1e877.webp",
  "/img/wall/6563084480771fa9604514a8-flex3-e71cd38b.webp",
  "/img/wall/6563e89af49f14fd0b5acbe6-m-3-551ab0d8.webp",
  "/img/wall/6563e89af49f14fd0b5acbfb-m-4-66e4dd17.webp",
  "/img/wall/celebration-imagine-zone-1280.webp",
  "/img/wall/connection-ai-hackathon-1280.webp",
  "/img/wall/6580d0d43581f1c0c27d11a6-1-a25c3abc.webp",
  "/img/wall/6580d0d43581f1c0c27d11c8-4-971da937.webp",
  "/img/wall/6580d0d4f711f2d3620b52c6-2-a4104476.webp",
  "/img/wall/66a9546a8380e67136abc62a-1-f6020354.webp",
  "/img/wall/66a9546acf1e1ab8e4308518-2-20bae012.webp",
  "/img/wall/66a9546b78531c808b3a5d15-4-637d15f8.webp",
  "/img/wall/65ba0b458acbe47294621842-hero.webp",
  "/img/wall/656465bd2facc454d6849645-t2-dfba8065.webp",
  "/img/wall/656465bbc76d08cd73a0f97b-t1-c069a1bb.webp",
  "/img/wall/workshop-team-build-1280.webp",
  "/img/wall/652b5a86745dfcd7b88431f0-l18opc3a-ba19c66d.webp",
  "/img/wall/652b5ada64423114e5bf5bbd-kx7281ha-ca5bdc8d.webp",
  "/img/wall/audience-centrality-laughter-1280.webp",
  "/img/wall/audience-inspire-her-theatre-1280.webp",
  "/img/wall/celebration-anniversary-booth-1280.webp",
  "/img/wall/celebration-awards-1280.webp",
  "/img/wall/celebration-swag-bags-1280.webp",
  "/img/wall/connection-google-aut-1280.webp",
  "/img/wall/divider-aws-community-1280.webp",
  "/img/wall/divider-crowd-wide-1280.webp",
  "/img/wall/divider-group-warm-1280.webp",
  "/img/wall/divider-trademe-group-1280.webp",
  "/img/wall/fireside-centrality-1280.webp",
  "/img/wall/hero-community-cheer-1280.webp",
  "/img/wall/panel-her-waka-1280.webp",
  "/img/wall/speaker-own-your-energy-1280.webp",
  "/img/wall/speaker-stage-spotlight-1280.webp",
  "/img/wall/655b023af7eb2bb1368c00bd-1-64da56f2.webp",
  "/img/wall/655b023cc76f59dedfca2077-2-c146664e.webp",
  "/img/wall/655d0a4549e047f69b5c27bb-pushpay-c4ffcbf5.webp",
  "/img/wall/64dc61661bb0399ff81776f0-img-9046-b5b101c8.webp",
  "/img/wall/671b32eca4bc707cb9917240-20241018-170104-497742d0.webp",
  "/img/wall/67db49bb3b686c80d4aac58b-20250314-184840-04a9551b.webp",
  "/img/wall/6562ce43960bdb74b66306cd-127570656-101583021744885-4e18a07e.webp",
  "/img/wall/652b5a42269c9abd616f5ec5-6flib3mf-7ce431c8.webp",
  "/img/wall/65471acd8ac2bb35ea704550-20231103165725-img-8090-4316b8a7.webp",
  "/img/wall/6554716daa1f871ebaa26e93-37981277-1015578832343851-4a17df33.webp",
  "/img/wall/655ae7b035c4aaeea893fe35-wit2-eeb998e2.webp",
  "/img/wall/655bd3f002f9416aa3f8f524-14-bfbb834c.webp",
  "/img/wall/655d09d99cad7d74fd8b20fa-tech-grand-tour-61f3cea0.webp",
  "/img/wall/65645fdb6f03289b84a791e1-12068784-1015470707393350-b3a43589.webp",
  "/img/wall/66d456166a015f57e5c91bc6-img-9823-425d85f0.webp",
  "/img/wall/66d45617fb990242de5364e8-img-9770-cdf21f07.webp",
  "/img/wall/671b32dc898cf47916e80983-anniversary-139-5d0442e3.webp",
  "/img/wall/671b331ade4581c6e9b6f82a-anniversary-161-6085afc4.webp",
  "/img/wall/68341ab3c6e15bfd8e06fba3-img-1346-min-2a4f3c4d.webp",
  "/img/wall/69263683f6ab48e4e61287b0-img-1473-991751d0.webp",
  "/img/wall/2025-11-hcltech-dunedin.webp",
  "/img/wall/66a953aa9ccf0dbd14588bae-hero-hackathon.webp",
  "/img/wall/celebration-group-smiles-1280.webp",
  "/img/wall/panel-mic-moment-1280.webp",
  "/img/wall/6563e88031018c5d48551c4c-m-hero.webp",
  "/img/wall/6502ac69333050f6e1b7db0f-techweek1-cab2599f.webp",
  "/img/wall/6502ac694a311a648c74804e-techweek-b545500e.webp",
  "/img/wall/hero-anniversary-crowd-1280.webp",
  "/img/wall/divider-community-room-1280.webp",
  "/img/wall/6562ce3e4112006d55a851d5-127918351-101583021738935-f45e98a9.webp",
  "/img/wall/divider-educator-conference-1280.webp",
  "/img/wall/655bd3efe64082464045708b-11-fa6bbc64.webp",
  "/img/wall/donate-2.webp",
  "/img/wall/6681f4b5e7cc858c424a5e12-img-9299-1-0c4c2c45.webp",
  "/img/wall/65643d3d7688a3e476f8cdc9-1520821-10153149531773504-687025875.webp",
  "/img/wall/65643d45bd5ebaf67648293e-10450175-1015314952416850-039f9281.webp",
  "/img/wall/65643df8dd9c45e1e3c9a036-10489907-1015314953033850-975d6889.webp",
  "/img/wall/6564559a29bdda8b1d93044d-10360540-10153787685418504-57802938.webp",
  "/img/wall/656455cabbeca1d93f8ce5a6-10923788-1015378768512350-09e54651.webp",
  "/img/wall/689454587ec5f00ec724894a-alejandro-davila-nz-conical-4b8fba0.webp",
];

/**
 * A deterministic spread of `count` tiles.
 *
 * Steps through the pool rather than slicing it, so a wall stays mixed across
 * eras and venues — the pool is ordered by the source scan, so taking the first
 * N would build a wall out of one afternoon. `offset` makes two walls in the
 * same deck differ.
 */
export function pickWallTiles(count: number, offset = 0): string[] {
  const step = Math.max(1, Math.floor(wallTiles.length / Math.max(1, count)));
  const out: string[] = [];
  for (let i = 0; out.length < count && i < wallTiles.length * 2; i += 1) {
    out.push(wallTiles[(offset + i * step) % wallTiles.length]);
  }
  return out.slice(0, count);
}
