const fs=require('node:fs'),{parse}=require('acorn');
const html=fs.readFileSync('index.html','utf8'),code=html.slice(html.lastIndexOf('<script>')+8,html.lastIndexOf('</script>'));
const catalog=JSON.parse(fs.readFileSync('locales/catalogs/es.json','utf8'));
const existing=new Set(Object.values(catalog.ui).filter(value=>typeof value==='string'));
const ast=parse(code,{ecmaVersion:'latest'}),missing=new Set();
function walk(node,visible=false){
  if(!node||typeof node!=='object')return;
  const assignment=node.type==='AssignmentExpression'&&node.left.type==='MemberExpression'&&['textContent','innerText','placeholder','title'].includes(node.left.property?.name);
  if(assignment){walk(node.right,true);return;}
  if(node.type==='Literal'&&visible&&typeof node.value==='string'&&/[a-záéíóúñ]{2}/i.test(node.value)&&!existing.has(node.value.replace(/\s+/g,' ').trim()))missing.add(node.value);
  for(const [key,value] of Object.entries(node)){
    if(['start','end'].includes(key))continue;
    if(Array.isArray(value))value.forEach(child=>walk(child,visible));
    else if(value&&typeof value==='object')walk(value,visible);
  }
}
walk(ast);console.log(JSON.stringify([...missing],null,2));
