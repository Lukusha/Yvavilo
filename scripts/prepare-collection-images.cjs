const fs=require('node:fs/promises');
const path=require('node:path');
const sharp=require(require.resolve('sharp',{paths:[require.resolve('next')]}));
async function main(){
 const manifest=JSON.parse(await fs.readFile(process.argv[2],'utf8'));
 const directory=path.resolve('public/images/collection');
 await fs.mkdir(directory,{recursive:true});
 for(const {id,source} of manifest){
  await sharp(source).resize({width:1000,withoutEnlargement:true}).webp({quality:88}).toFile(path.join(directory,id+'.webp'));
  const stat=await fs.stat(path.join(directory,id+'.webp'));console.log(id,Math.round(stat.size/1024)+' KB');
 }
}
main().catch(error=>{console.error(error);process.exitCode=1});
