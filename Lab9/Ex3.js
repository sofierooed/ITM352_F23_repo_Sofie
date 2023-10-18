attributes  =  "Sofie;22;22.5;-21.5" ;
let pieces = attributes.split(";");

console.log(`pieces is ${typeof pieces}`)
console.log(pieces)

for(let part of pieces) {
    console.log(`${part} is type ${typeof part}`);
};

let invert = pieces.join(", ");
console.log(invert)
console.log(`invert is ${typeof invert}`)