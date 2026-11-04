/** Individually authored Ashfall inhabitants. Geometry and belongings identify each person. */
type Rect = (x: number, y: number, width: number, height: number, color: string) => void;
const ink = "#1b2833", brass = "#d7af68";
export const namedVillagers = ["Mabel Crumb", "Pip Bellwether", "Orla Soot", "Bram Pickle", "Tansy Bolt", "Hob Nettle", "Dora Teaspoon", "Fenwick Moss", "Ada Candle", "Nell Thread", "Bix Turnip", "Wren Lastlight"] as const;
export function drawNamedVillager(name: string, r: Rect): boolean {
  const head = (x: number, y: number, skin: string, hair: string, width = 8) => {
    r(x-1,y-1,width+2,10,ink);r(x,y,width,8,skin);r(x,y,width,2,hair);
    r(x,y+2,2,4,hair);r(x+width-2,y+4,1,1,ink);r(x+width-1,y+6,2,1,skin);
    r(x+3,y+6,2,1,"#a36d5d");
  };
  const shoe = (x: number, y: number, w = 5) => {r(x,y,w,3,ink);r(x+1,y,w-1,1,"#87715b");};
  switch(name) {
    case "Mabel Crumb": {
      // Round baker, puffed sleeves, white apron, and a pie on an oven tray.
      r(9,24,7,5,"#6d4941");r(19,24,5,5,"#6d4941");shoe(8,28,8);shoe(19,28,7);
      r(6,13,20,13,ink);r(7,13,18,12,"#a66565");r(5,15,5,7,"#d09083");
      r(11,13,11,14,"#e6d9bb");r(12,14,2,10,"#fff0cf");r(15,20,6,4,"#b9b7a0");
      r(7,20,4,3,"#efb88f");r(24,16,4,6,"#efb88f");
      head(12,5,"#e8b48c","#755443");
      r(9,3,14,4,"#f6ebd3");r(10,1,5,4,"#e5dbc4");r(16,0,5,4,"#f6ebd3");r(21,2,3,4,"#c6c8b5");
      r(20,22,11,3,"#5f7883");r(22,18,7,4,"#bd8754");r(23,18,5,1,"#f0ce89");r(24,20,3,1,"#815339");
      return true;
    }
    case "Pip Bellwether": {
      // Tall, narrow bellringer with a long waistcoat and a bell held away from his body.
      r(12,22,4,7,"#625764");r(18,22,3,7,"#625764");shoe(11,28);shoe(17,28,6);
      r(10,12,12,13,ink);r(11,12,10,12,"#816875");r(14,13,4,11,"#d6c49e");
      r(9,14,3,9,"#ad8e92");r(10,22,3,2,"#d6a07b");r(21,13,3,7,"#ad8e92");r(23,17,4,3,"#d6a07b");
      head(13,3,"#d6a07b","#bda995",7);r(12,2,8,2,"#d5c4a8");r(14,8,2,2,"#ede1bd");
      r(25,12,2,7,"#795c3e");r(24,18,4,5,brass);r(22,22,8,3,brass);r(23,22,6,1,"#f4d893");r(26,25,1,2,ink);
      r(16,17,1,1,brass);r(16,21,1,1,brass);return true;
    }
    case "Orla Soot": {
      // Silver curls, broad shawl, and a tall framed mirror with a reflected glint.
      r(7,21,17,8,ink);r(9,21,13,7,"#686e82");shoe(8,28,7);shoe(18,28,6);
      r(6,12,20,9,ink);r(7,12,18,8,"#8d7b9e");r(9,15,14,10,"#776583");r(10,16,3,8,"#b09cba");
      head(10,4,"#bd865f","#d5d1bf",9);r(8,3,13,4,"#b3b8b4");r(9,2,5,3,"#e3dbc4");r(8,7,3,5,"#b3b8b4");
      r(15,8,7,1,"#4a4247");r(15,8,3,3,"#d7cab3");r(20,8,3,3,"#d7cab3");
      r(23,9,7,20,ink);r(24,10,5,18,brass);r(25,12,3,14,"#81acbb");r(25,14,1,8,"#e1f0e8");r(26,13,2,2,"#e1f0e8");
      r(21,19,5,3,"#bd865f");return true;
    }
    case "Bram Pickle": {
      // Short, stout, balding tax collector; round spectacles and an oversized ledger.
      r(9,24,7,5,"#514b56");r(18,24,6,5,"#514b56");shoe(8,28,8);shoe(18,28,8);
      r(6,13,20,14,ink);r(7,14,18,11,"#934d50");r(11,14,10,11,"#b46a60");
      r(15,14,2,8,"#e6d4ac");r(9,24,14,2,"#523a35");r(18,24,3,2,brass);
      head(10,4,"#dfa779","#694d3d",10);r(13,3,5,3,"#dfa779");r(11,8,4,2,"#e5d2a7");r(17,8,4,2,"#e5d2a7");r(15,8,2,1,brass);r(14,11,6,2,"#694d3d");
      r(2,16,10,12,ink);r(3,17,8,10,"#667c6d");r(4,18,1,8,brass);r(6,19,4,1,"#ddd4ae");r(6,22,4,1,"#ddd4ae");
      r(9,19,3,3,"#dfa779");r(24,18,3,5,"#dfa779");return true;
    }
    case "Tansy Bolt": {
      // Broad-shouldered mechanic in split overalls, rolled sleeves, and a large spanner.
      r(10,21,5,8,"#4b6869");r(19,21,5,8,"#4b6869");shoe(8,28,7);shoe(19,28,7);
      r(8,12,17,12,ink);r(9,13,15,10,"#b99b6a");r(12,13,9,12,"#4b7f7b");
      r(12,13,2,7,"#9eb4a0");r(19,13,2,7,"#9eb4a0");r(14,18,5,4,"#315956");
      r(6,14,5,4,"#dac29a");r(7,18,3,6,"#b37b59");r(23,14,5,4,"#dac29a");r(25,18,3,6,"#b37b59");
      head(12,3,"#b37b59","#a65c3b");r(11,2,10,3,"#bd7547");r(17,1,5,4,"#a65c3b");
      r(11,5,11,2,"#483e38");r(12,4,3,3,"#9fc1c6");r(18,4,3,3,"#9fc1c6");
      r(27,9,2,17,"#9bb0b9");r(25,8,6,3,"#c5d4ce");r(25,5,2,5,"#9bb0b9");r(29,5,2,5,"#9bb0b9");return true;
    }
    case "Hob Nettle": {
      // Hunched elder: bent cloak, long beard, planted cane, and a ragged hem.
      shoe(7,28,7);shoe(17,28,6);
      r(7,14,17,13,ink);r(8,14,14,12,"#747044");r(6,19,5,8,"#555b3a");
      r(10,16,4,10,"#a09b64");r(18,20,6,7,"#4d5439");r(8,27,4,2,"#747044");
      head(14,7,"#cda57d","#cbc6aa");r(12,6,8,4,"#a8ab92");r(13,10,3,7,"#cbc6aa");r(17,13,5,6,"#ddd5b4");r(18,18,3,3,"#b7b69c");
      r(23,17,5,3,"#cda57d");r(27,12,2,18,"#957d50");r(25,11,4,3,"#b69b67");
      r(7,13,4,2,"#a3ad77");r(5,16,3,2,"#778a57");return true;
    }
    case "Dora Teaspoon": {
      // Grandmother with a high bun, orange shawl, full blue skirt, and a kettle.
      r(7,25,17,5,ink);r(8,21,15,8,"#527b91");r(6,25,20,3,"#7199a8");shoe(8,29,6);shoe(20,29,6);
      r(9,12,14,13,ink);r(10,13,12,11,"#537c8b");r(8,12,16,6,"#c29168");r(10,16,5,4,"#e0b88b");r(19,16,4,5,"#ab7854");
      for(const [x,y] of [[11,22],[17,24],[13,26]]) r(x,y,2,1,"#b5c7bc");
      head(11,4,"#e0b28c","#d4c8b3");r(9,2,6,6,"#b6b5a5");r(10,1,4,3,"#e4dac0");r(10,7,2,6,"#d4c8b3");
      r(13,8,3,2,"#e4dcbf");r(18,8,3,2,"#e4dcbf");r(16,8,2,1,"#796d61");
      r(7,18,3,6,"#e0b28c");r(22,19,3,5,"#e0b28c");
      r(23,25,8,5,"#71898f");r(25,23,4,2,"#b0c2bc");r(25,21,5,2,"#71898f");r(29,25,2,2,"#c9d4c8");r(22,25,2,2,"#71898f");return true;
    }
    case "Fenwick Moss": {
      // Rugged woodsman with a heavy pack, shoulder cape, beard, and a rolled map.
      r(9,23,5,6,"#6b5140");r(18,23,5,6,"#6b5140");shoe(7,28,7);shoe(18,28,7);
      r(3,9,9,17,ink);r(4,10,7,14,"#74543b");r(3,12,8,2,"#b29864");r(4,22,7,2,"#b29864");
      r(10,12,15,14,ink);r(11,13,13,12,"#496c50");r(8,12,18,5,"#829368");r(12,18,3,6,"#a3b184");
      head(14,3,"#c28e63","#593f30");r(12,2,11,4,"#694d32");r(13,9,3,5,"#694d32");r(17,10,6,4,"#694d32");r(18,11,3,1,"#9b7851");
      r(23,17,4,7,"#c28e63");r(25,21,5,9,"#d6c591");r(26,22,2,6,"#f2e3b7");r(25,24,5,2,"#96754b");
      r(7,7,4,3,"#729368");r(4,6,3,5,"#55764e");return true;
    }
    case "Ada Candle": {
      // Slender candlekeeper with pale braids, a long robe, and a lit taper.
      r(11,23,12,7,ink);r(12,22,10,7,"#465570");r(14,27,2,2,"#8994a0");shoe(10,29,6);shoe(20,29,5);
      r(10,12,13,13,ink);r(11,13,11,12,"#536681");r(10,12,13,4,"#a96469");r(18,16,3,7,"#a96469");
      head(12,3,"#95684e","#e1d8be",7);r(11,1,9,4,"#ddd4bd");r(10,5,2,11,"#c7c4ae");r(20,5,2,10,"#c7c4ae");r(11,12,1,2,brass);r(20,12,1,2,brass);
      r(8,16,4,7,"#536681");r(9,21,6,3,"#95684e");r(22,17,3,4,"#95684e");
      r(25,11,3,13,"#f1e1b0");r(24,23,6,2,brass);r(26,7,2,4,"#e5ad60");r(26,8,1,2,"#fff0c0");r(25,17,1,5,"#c7b788");return true;
    }
    case "Nell Thread": {
      // Tailor with a side braid, belted apron, fabric roll, and long sewing needle.
      r(10,23,14,7,ink);r(11,24,12,5,"#79657f");shoe(9,29,6);shoe(21,29,5);
      r(8,12,17,14,ink);r(9,13,15,12,"#8c738e");r(12,15,9,11,"#c5b7ac");r(13,16,2,8,"#eee1c5");r(10,20,14,2,"#60485d");r(17,20,2,2,brass);
      head(12,3,"#d3a17d","#4c3b42");r(11,2,10,4,"#4c3b42");r(20,5,3,11,"#4c3b42");r(21,10,1,4,"#9f8178");
      r(7,17,3,6,"#d3a17d");r(23,17,4,4,"#d3a17d");
      r(3,19,5,11,"#9b8cac");r(2,19,7,2,"#dac4a2");r(3,28,5,2,"#dac4a2");r(5,21,1,6,"#d7c6dd");
      r(28,7,1,19,"#c6d5d0");r(27,8,3,1,"#c6d5d0");r(26,11,2,1,"#cfaaac");r(25,12,1,4,"#cfaaac");return true;
    }
    case "Bix Turnip": {
      // Small farmer in knee-length overalls, cradling an oversized purple turnip.
      r(10,23,4,6,"#d6a27b");r(19,23,4,6,"#d6a27b");shoe(8,28,6);shoe(19,28,6);
      r(8,15,17,11,ink);r(9,15,15,8,"#c9b98c");r(12,16,10,9,"#647f9a");r(12,15,2,7,"#96b2be");r(19,15,2,7,"#96b2be");r(15,20,4,3,"#3b5976");
      head(11,5,"#d6a27b","#927048",9);r(10,3,12,4,"#927048");r(9,6,3,5,"#b08a58");r(19,4,4,4,"#a67c4c");
      r(7,18,4,6,"#d6a27b");r(23,18,3,5,"#d6a27b");
      r(20,22,9,6,"#a487ad");r(22,27,5,3,"#e2cfc1");r(24,29,1,2,"#d6bf9b");r(21,23,2,3,"#d1b7cf");
      r(23,18,2,5,"#74965e");r(19,17,4,3,"#8fb271");r(25,16,3,4,"#63864f");return true;
    }
    case "Wren Lastlight": {
      // Windswept silver bob, asymmetrical travelling cape, tall boots, and a brass instrument.
      r(10,22,4,8,"#5a4a68");r(20,21,4,9,"#5a4a68");shoe(8,29,6);shoe(20,29,6);
      r(8,12,17,13,ink);r(10,13,13,10,"#586579");r(9,12,7,14,"#80709b");r(6,18,5,10,"#645576");r(5,26,4,3,"#80709b");r(12,14,2,9,"#b9a8bd");
      head(12,3,"#bd9778","#c7c9c1");r(11,1,11,4,"#dee0d0");r(9,4,4,5,"#c7c9c1");r(20,3,4,3,"#c7c9c1");r(21,6,2,5,"#a7b3b2");
      r(17,13,7,3,"#b4a385");r(21,16,5,6,"#bd9778");
      r(23,20,7,9,ink);r(24,21,5,7,brass);r(25,23,3,3,"#638d9d");r(26,21,1,6,"#f5dfaa");
      r(10,23,9,2,"#806348");r(13,23,3,2,brass);return true;
    }
    default: return false;
  }
}
