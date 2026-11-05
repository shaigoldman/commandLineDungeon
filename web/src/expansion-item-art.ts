/** Original silhouettes for expansion loot; every variant shares the production item renderer. */
type Rect = (x: number, y: number, width: number, height: number, color: string) => void;
const ink = "#17202e", light = "#fff0ce", gold = "#d8b365", blue = "#79cee5";
export function drawExpansionItem(key: string, r: Rect): boolean {
  const spark = (x: number, y: number, c: string) => { r(x+1,y,1,5,c);r(x,y+2,4,1,c); };
  const diamond = (x: number, y: number, c: string, shine = light) => {
    r(x+4,y,8,2,ink);r(x+1,y+2,14,6,ink);r(x+3,y+8,10,3,ink);r(x+6,y+11,4,4,ink);
    r(x+4,y+2,8,3,c);r(x+2,y+5,12,2,c);r(x+4,y+7,8,3,c);r(x+6,y+10,4,3,c);
    r(x+5,y+2,2,5,shine);r(x+7,y+7,2,4,shine);
  };
  const flask = (a: string, b: string, tiny = false) => {
    r(12,3,8,5,ink);r(13,4,6,3,gold);r(13,8,6,5,ink);
    r(tiny?9:6,12,tiny?14:20,tiny?15:17,ink);
    r(tiny?11:8,13,tiny?10:16,tiny?12:14,"#80a6b6");
    r(tiny?12:9,17,tiny?8:14,tiny?7:9,a);r(tiny?16:16,18,tiny?4:7,tiny?6:8,b);
    r(tiny?12:9,14,2,8,light);
  };
  const boots = (c: string, ghost: boolean) => {
    for(const x of [3,18]) {
      r(x+3,5,8,16,ink);r(x+4,7,6,13,c);r(x,20,12,8,ink);r(x+1,21,10,5,c);
      r(x+4,8,2,10,light);
      if(ghost) {r(x+3,24,2,4,"#446e85");r(x+8,25,2,4,"#446e85");r(x+6,3,3,2,c);}
      else {r(x+2,24,10,2,gold);r(x+6,15,4,2,"#a25d3c");}
    }
    if(ghost) {spark(0,10,blue);spark(27,2,light);}
    else {r(0,9,7,2,light);r(0,13,6,2,gold);r(22,2,8,2,light);}
  };
  if(key === "sand") {
    r(3,25,26,4,ink);r(6,21,20,5,"#a87c45");r(10,17,14,7,"#d4b679");r(14,13,7,9,"#edd296");
    for(const [x,y] of [[4,20],[10,12],[22,15],[27,22],[16,8]]) r(x,y,2,2,"#e8cc8d");
    r(9,25,3,1,light);r(19,22,2,1,light);return true;
  }
  if(key === "sand-bag") {
    r(10,4,13,7,ink);r(12,5,9,5,"#a58153");r(10,10,13,3,gold);
    r(8,13,18,4,ink);r(5,17,23,12,ink);r(7,17,19,10,"#987349");
    r(9,15,15,10,"#c3a26b");r(10,16,3,7,"#e0c18a");r(14,17,8,1,"#806143");
    r(20,22,2,5,"#705139");r(11,28,18,2,"#d4b679");r(25,26,3,2,"#edd296");
    r(12,10,2,4,"#6c4c35");r(21,10,2,5,"#6c4c35");return true;
  }
  if(key === "sandstorm" || key === "quicksand") {
    for(let n=0;n<18;n++) {r(6+n,27-n,3,3,ink);r(7+n,27-n,1,2,gold);}
    if(key === "sandstorm") {
      r(16,3,12,3,"#d5af69");r(13,7,16,3,"#edcd8d");r(17,11,10,3,"#af824e");r(20,14,5,3,"#edcd8d");
      r(14,4,3,2,light);r(27,3,2,3,light);r(10,8,2,2,"#edcd8d");r(27,13,2,2,"#edcd8d");
    } else {
      r(17,2,12,3,gold);r(18,5,2,12,ink);r(26,5,2,12,ink);r(20,5,6,3,blue);
      r(22,8,2,3,"#d9ba7f");r(21,12,4,2,"#d9ba7f");r(20,14,6,2,"#d9ba7f");r(17,17,12,3,gold);
    }return true;
  }
  if(key === "tiny-mana-potion") {flask("#528ecd","#8dd5ec",true);r(15,19,3,4,light);return true;}
  if(key === "energy-potion") {flask("#d97a87",blue);r(16,13,3,6,gold);r(13,18,5,3,gold);r(14,21,3,5,light);return true;}
  if(key === "mixing-potion") {
    flask("#a887d7","#7dc4a1");r(10,7,3,8,ink);r(11,8,2,5,"#c7e4d2");r(22,8,3,7,ink);
    r(23,9,1,5,"#d6c3eb");r(10,21,5,1,light);r(19,20,1,5,light);r(17,22,5,1,light);return true;
  }
  if(key === "mana-link") {
    diamond(0,4,"#d88799");diamond(16,13,blue);
    r(10,15,5,3,gold);r(13,13,5,3,gold);r(16,11,5,3,gold);r(12,16,3,1,light);return true;
  }
  if(key === "alchemy-nuke") {
    r(9,4,14,5,ink);r(11,5,10,3,gold);r(12,9,8,4,ink);r(5,13,22,16,ink);
    r(7,14,18,13,"#638ba3");r(8,20,8,6,"#be7abb");r(16,19,8,7,"#78c8a1");r(9,15,2,7,light);
    r(13,16,6,3,gold);r(15,14,2,8,gold);r(15,17,2,2,ink);spark(2,4,"#de9ac8");spark(26,7,"#9ae1b2");return true;
  }
  if(key === "escape-pod") {
    r(12,2,8,3,ink);r(8,5,16,22,ink);r(10,6,12,19,"#85acbb");r(12,7,8,13,"#bde8e1");
    r(14,9,4,4,"#38556b");r(13,13,6,6,"#38556b");r(7,23,5,7,gold);r(20,23,5,7,gold);
    r(13,26,6,3,"#f1af6c");r(15,28,2,3,light);r(11,7,1,13,light);return true;
  }
  if(key === "critical-diamond") {
    diamond(8,3,"#e5a567");r(14,8,4,3,"#ad534e");r(15,6,2,8,"#ad534e");
    for(let n=0;n<5;n++) {r(4+n*5,24,4,5,ink);r(5+n*5,25,2,3,gold);}return true;
  }
  if(key === "mana-stream" || key === "mana-pool" || key === "mana-spring") {
    r(3,23,26,6,ink);r(5,24,22,3,"#668b9b");r(7,22,18,3,blue);r(10,23,11,1,light);
    if(key === "mana-pool") {r(6,20,20,2,"#bad3cc");r(12,18,8,2,"#6fa9c7");r(16,15,2,3,blue);}
    else {
      r(14,7,4,16,"#76b9db");r(15,8,1,13,light);r(10,4,12,3,blue);r(7,7,5,3,blue);r(20,7,5,3,blue);
      r(6,10,2,6,blue);r(24,10,2,6,blue);
      if(key === "mana-spring") {r(8,14,16,3,gold);r(10,17,12,2,"#afcdd1");spark(2,3,light);spark(26,2,light);}
      else {r(22,17,8,10,ink);r(23,18,6,8,gold);r(25,19,2,5,light);}
    }return true;
  }
  if(key === "mana-pot") {
    r(5,9,22,4,ink);r(7,10,18,2,gold);r(7,13,18,14,ink);r(9,14,14,11,"#507ca8");
    r(3,15,5,8,gold);r(24,15,5,8,gold);r(11,15,2,8,blue);r(18,18,3,5,blue);
    r(12,3,8,6,ink);r(13,4,6,4,gold);r(15,5,2,2,light);return true;
  }
  if(key === "golden-apple" || key === "diamond-apple") {
    const crystal=key === "diamond-apple", body=crystal ? "#87c7df" : "#d8ac4f", hi=crystal ? "#e5f9ff" : "#ffe394";
    r(7,9,8,3,ink);r(17,9,8,3,ink);r(4,12,24,12,ink);r(7,24,18,5,ink);
    r(7,12,18,12,body);r(10,24,12,3,body);r(6,14,20,7,body);r(9,13,4,8,hi);r(11,24,3,2,hi);
    r(15,4,3,8,"#846040");r(18,3,8,4,"#7dbb76");r(18,6,5,2,"#4d805c");
    if(crystal) {r(15,13,2,11,"#c1e8f0");r(11,20,11,2,"#c1e8f0");spark(27,6,hi);}return true;
  }
  if(key === "mana-leech") {
    r(5,13,6,13,ink);r(10,10,7,13,ink);r(16,6,7,14,ink);r(21,4,6,9,ink);
    r(7,15,3,9,"#526ea4");r(11,12,5,9,"#6f9dca");r(17,8,4,10,"#7bb8d4");r(22,6,3,5,blue);
    r(12,13,2,6,"#c6e7ed");r(21,6,2,2,ink);r(24,9,4,2,"#cf9cb6");r(5,26,8,2,"#687da6");return true;
  }
  if(key === "energy-belt") {
    r(2,11,28,12,ink);r(3,13,26,8,"#855b42");r(4,14,24,1,"#c39662");
    r(10,9,13,16,gold);r(12,11,9,12,ink);r(13,12,7,10,"#5596a6");
    r(16,12,3,4,blue);r(14,16,5,3,light);r(15,19,2,4,blue);r(26,16,2,2,gold);return true;
  }
  if(key === "energy-armor") {
    r(9,4,14,5,ink);r(3,8,26,9,ink);r(7,17,18,12,ink);r(8,9,16,18,"#668695");
    r(4,10,5,5,"#a1bcc7");r(23,10,5,5,"#a1bcc7");r(11,5,10,4,ink);r(10,10,2,14,"#bfd9d5");
    r(17,10,4,7,blue);r(13,16,7,4,light);r(15,20,3,6,blue);r(9,26,14,2,gold);return true;
  }
  if(key === "quickfoot" || key === "ghost-boots") {boots(key === "quickfoot" ? "#ceab5f" : "#9fcfdc",key === "ghost-boots");return true;}
  if(key === "lucky-amulet" || key === "lucky-necklace") {
    const amulet=key === "lucky-amulet";
    r(7,3,18,3,gold);r(5,6,3,11,gold);r(24,6,3,11,gold);r(7,17,4,3,gold);r(21,17,4,3,gold);
    if(amulet) {
      r(10,16,13,13,ink);r(12,17,9,10,gold);for(const [x,y] of [[13,19],[17,19],[13,23],[17,23]]) r(x,y,3,3,"#7ab78a");r(15,22,2,6,"#c8e5a1");
    } else {
      for(const x of [8,13,18,23]) {r(x,11,3,4,"#89b9cc");r(x,11,1,2,light);}
      r(13,18,4,3,"#dc9dac");r(19,18,4,3,"#dc9dac");r(12,21,12,3,"#dc9dac");r(15,24,6,3,"#dc9dac");r(17,27,2,2,light);
    }return true;
  }
  if(key === "mana-battery") {
    r(11,2,10,4,ink);r(12,3,8,2,gold);r(7,6,18,24,ink);r(9,7,14,21,"#526c8e");r(10,8,2,18,"#a9c6db");
    r(17,10,4,7,"#b79ee9");r(13,16,7,4,light);r(15,20,3,6,"#b79ee9");r(12,25,10,2,blue);return true;
  }
  if(key === "bloodthirsty-dagger") {
    for(let n=0;n<15;n++) {r(9+n,24-n,5,4,ink);r(10+n,24-n,3,2,"#a4b8c4");r(11+n,24-n,1,1,light);}
    r(20,9,4,7,"#b35c73");r(18,15,4,5,"#d37b88");r(7,21,8,3,gold);r(9,19,3,8,gold);
    r(5,25,6,5,"#734656");r(4,28,4,3,gold);r(23,19,2,4,"#cf7180");return true;
  }
  if(key.startsWith("advanced-")) {
    const kind=key.slice(9,-6);
    const colors: Record<string,string> = {elemental:"#d4c18b",dark:"#79558f",onyx:"#4b3b63",emerald:"#64b58b",sapphire:"#6da9de",ruby:"#d36c78"};
    const c=colors[kind] || gold;
    r(14,10,4,21,ink);r(15,11,2,19,c);r(15,17,1,10,light);r(11,12,10,3,gold);
    if(kind === "elemental") {diamond(8,1,c);r(7,7,4,5,"#79bbdf");r(22,7,4,5,"#e38b6e");r(14,0,4,5,"#88d6ad");spark(25,1,light);}
    else if(kind === "dark") {r(7,1,4,12,c);r(21,1,4,12,c);r(10,6,12,8,c);r(12,8,3,3,ink);r(18,8,3,3,ink);r(14,12,5,5,"#c69ed7");}
    else if(kind === "onyx") {diamond(8,1,c,"#c9b0eb");r(6,4,4,9,gold);r(23,4,4,9,gold);r(12,17,9,3,"#a782c8");spark(2,3,"#c9b0eb");}
    else if(kind === "emerald") {diamond(8,1,c);r(5,7,7,3,"#96d9ac");r(21,4,6,3,"#96d9ac");r(11,18,5,3,c);r(17,22,5,3,c);}
    else if(kind === "sapphire") {r(5,1,4,11,c);r(23,1,4,11,c);r(7,10,18,4,c);diamond(8,0,c);r(10,18,5,2,blue);r(17,23,5,2,blue);}
    else {r(8,6,16,7,c);r(11,2,5,10,"#f1a06b");r(18,0,4,11,c);r(14,5,4,7,"#ffe3a3");r(12,18,8,3,c);r(13,24,6,2,c);}
    return true;
  }
  if(key === "giant-bomb") {
    r(3,12,26,14,ink);r(5,13,22,11,"#624b67");r(6,15,3,7,"#a78aa1");r(20,14,5,9,"#493b55");
    r(8,9,16,4,gold);r(15,5,4,6,"#95704b");r(18,3,7,3,"#df9d62");spark(25,0,"#ffe1a0");r(12,17,8,2,gold);r(15,14,2,9,gold);return true;
  }
  if(key === "trash") {
    r(5,18,8,9,ink);r(7,17,10,9,"#aab1aa");r(12,12,8,13,"#d6d2b9");r(15,16,10,11,"#b9bcaa");
    r(9,20,5,2,"#737e7d");r(17,18,2,6,"#8b978a");r(22,25,6,3,"#927151");r(25,22,3,4,"#bc996c");return true;
  }
  return false;
}
