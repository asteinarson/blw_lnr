
export {};

console.log("My args: ");
console.log(process.argv);

async function sleep(ms:number) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

for (let ix = 0; ix < 10; ix++) {
    console.log("ix: " + ix);
    await sleep(500);
}
