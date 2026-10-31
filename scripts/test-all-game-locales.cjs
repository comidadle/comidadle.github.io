const {spawnSync}=require('node:child_process');
const path=require('node:path');
for(const locale of ['es','en','fr','de','pt-BR','pt-PT']){
  const result=spawnSync(process.execPath,[path.join(__dirname,'test-game-preview.cjs'),locale],{stdio:'inherit',windowsHide:true});
  if(result.status)process.exit(result.status);
}
