const fs=require('node:fs'),path=require('node:path');
const dir=path.join(__dirname,'../locales/catalogs'),source=JSON.parse(fs.readFileSync(path.join(dir,'es.json'),'utf8'));
const locales=['en','fr','de','pt-BR','pt-PT'];
const {createMatcher}=require('../i18n/geography.js');
const geography=createMatcher({countries:source.flags});
const ingredients={
  pollo:['Chicken','au poulet','Hähnchen','frango','frango'],gallina:['Hen','à la poule','Huhn','galinha','galinha'],
  res:['Beef','au bœuf','Rindfleisch','carne bovina','carne de vaca'],carne:['Meat','à la viande','Fleisch','carne','carne'],
  cerdo:['Pork','au porc','Schweinefleisch','porco','porco'],cordero:['Lamb',"à l’agneau",'Lammfleisch','cordeiro','borrego'],
  pescado:['Fish','au poisson','Fisch','peixe','peixe'],camarón:['Shrimp','aux crevettes','Garnelen','camarão','camarão'],camarones:['Shrimp','aux crevettes','Garnelen','camarões','camarões'],
  mariscos:['Seafood','aux fruits de mer','Meeresfrüchten','frutos do mar','marisco'],queso:['Cheese','au fromage','Käse','queijo','queijo'],
  arroz:['Rice','au riz','Reis','arroz','arroz'],maíz:['Corn','au maïs','Mais','milho','milho'],choclo:['Corn','au maïs','Mais','milho','milho'],elote:['Corn','au maïs','Mais','milho','milho'],
  papa:['Potato','aux pommes de terre','Kartoffeln','batata','batata'],papas:['Potato','aux pommes de terre','Kartoffeln','batatas','batatas'],
  coco:['Coconut','à la noix de coco','Kokos','coco','coco'],yuca:['Cassava','au manioc','Maniok','mandioca','mandioca'],
  plátano:['Plantain','à la banane plantain','Kochbananen','banana-da-terra','banana-pão'],frijoles:['Bean','aux haricots','Bohnen','feijão','feijão'],
  frijol:['Bean','aux haricots','Bohnen','feijão','feijão'],leche:['Milk','au lait','Milch','leite','leite'],
  maní:['Peanut','aux cacahuètes','Erdnüssen','amendoim','amendoim'],pulpo:['Octopus','au poulpe','Oktopus','polvo','polvo'],
  salmón:['Salmon','au saumon','Lachs','salmão','salmão'],jamón:['Ham','au jambon','Schinken','presunto','presunto'],
};
const bases={sopa:['Soup','Soupe','Suppe','Sopa','Sopa'],caldo:['Broth','Bouillon','Brühe','Caldo','Caldo'],arroz:['Rice','Riz','Reis','Arroz','Arroz'],
  pastel:['Pie','Tourte','Pastete','Torta','Empada'],torta:['Cake','Gâteau','Kuchen','Bolo','Bolo'],tarta:['Tart','Tarte','Tarte','Torta','Tarte'],
  cazuela:['Casserole','Cocotte','Eintopf','Ensopado','Ensopado'],estofado:['Stew','Ragoût','Eintopf','Ensopado','Estufado'],
  guiso:['Stew','Ragoût','Eintopf','Ensopado','Guisado'],pan:['Bread','Pain','Brot','Pão','Pão'],ensalada:['Salad','Salade','Salat','Salada','Salada']};
const patterns=[
  [/^Pepitoria de Gallina\b/i,['Hen in pepitoria sauce','Poule en sauce pepitoria','Huhn in Pepitoria-Sauce','Galinha ao molho de pepitoria','Galinha em molho de pepitoria']],
  [/^Pollo en Pepitoria\b/i,['Chicken in pepitoria sauce','Poulet en sauce pepitoria','Hähnchen in Pepitoria-Sauce','Frango ao molho de pepitoria','Frango em molho de pepitoria']],
  [/^Hojaldras Panameñas$/i,['Panamanian fried bread','Pain frit panaméen','Panamaisches frittiertes Brot','Pão frito panamenho','Pão frito panamiano']],
  [/^Arroz con Pollo\b/i,['Chicken and rice','Riz au poulet','Hähnchen mit Reis','Arroz com frango','Arroz com frango']],
  [/^Arroz con Leche\b/i,['Rice pudding','Riz au lait','Milchreis','Arroz-doce','Arroz-doce']],
  [/^Arroz con Coco\b/i,['Coconut rice','Riz à la noix de coco','Kokosreis','Arroz com coco','Arroz de coco']],
  [/^Sopa de Pollo\b/i,['Chicken soup','Soupe de poulet','Hühnersuppe','Sopa de frango','Sopa de frango']],
  [/^Sopa de Cebolla\b/i,['Onion soup',"Soupe à l’oignon",'Zwiebelsuppe','Sopa de cebola','Sopa de cebola']],
  [/^Sopa de Albóndigas\b/i,['Meatball soup','Soupe aux boulettes de viande','Fleischbällchensuppe','Sopa de almôndegas','Sopa de almôndegas']],
  [/^Caldo de Pollo\b/i,['Chicken broth','Bouillon de poulet','Hühnerbrühe','Caldo de frango','Caldo de frango']],
  [/^Leche Frita$/i,['Fried milk custard','Lait frit','Frittierte Milch','Leite frito','Leite frito']],
  [/^Sushi de Salmón$/i,['Salmon sushi','Sushi au saumon','Lachs-Sushi','Sushi de salmão','Sushi de salmão']],
  [/^Tortilla Española$/i,['Spanish potato omelette','Omelette espagnole aux pommes de terre','Spanisches Kartoffelomelett','Omelete espanhola de batata','Omeleta espanhola de batata']],
  [/^Ropa Vieja Cubana$/i,['Cuban ropa vieja','Ropa vieja cubaine','Kubanische Ropa vieja','Ropa vieja cubana','Ropa vieja cubana']],
];
for(const [index,locale] of locales.entries()){
  const file=path.join(dir,locale+'.json'),catalog=JSON.parse(fs.readFileSync(file,'utf8'));
  for(const [id,dish] of Object.entries(source.dishes)){
    const current=catalog.dishes[id].displayName;
    if(current!==dish.name)continue;
    const parts=dish.name.match(/^(.+?)\s+(de|con)\s+(.+)$/i);if(!parts)continue;
    for(const [ingredient,translations] of Object.entries(ingredients)){
      if(!parts[3].toLowerCase().startsWith(ingredient))continue;
      const tail=parts[3].slice(ingredient.length).trim();if(tail&&!/^[…\s-]+$/.test(geography.redact(tail)))continue;
      const base=bases[parts[1].toLowerCase()]?.[index]||parts[1],item=translations[index];
      catalog.dishes[id].displayName=index===0?`${item} ${base.toLowerCase()}`:index===1?`${base} ${item}`:index===2?`${base} mit ${item}`:`${base} ${parts[2].toLowerCase()==='con'?'com':'de'} ${item}`;
      break;
    }
  }
  for(const [id,dish] of Object.entries(source.dishes))for(const [pattern,translations] of patterns)if(pattern.test(dish.name)){catalog.dishes[id].displayName=translations[index];break;}
  fs.writeFileSync(file,JSON.stringify(catalog,null,2)+'\n');
}
