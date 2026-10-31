const fs=require('node:fs'),path=require('node:path');
const dir=path.join(__dirname,'../locales/catalogs'),source=JSON.parse(fs.readFileSync(path.join(dir,'es.json'),'utf8'));
const locales=['en','fr','de','pt-BR','pt-PT'];
const patterns=[
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
  for(const [id,dish] of Object.entries(source.dishes))for(const [pattern,translations] of patterns)if(pattern.test(dish.name)){catalog.dishes[id].displayName=translations[index];break;}
  fs.writeFileSync(file,JSON.stringify(catalog,null,2)+'\n');
}
