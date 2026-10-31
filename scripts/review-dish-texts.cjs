const fs=require('node:fs'),path=require('node:path');
const dir=path.join(__dirname,'../locales/catalogs'),locales=['en','fr','de','pt-BR','pt-PT'];
// Correcciones editoriales de los platos reproducidos en las capturas.
const descriptions={
  'Hojaldras Panameñas':[
    'Soft, airy fried bread served for breakfast with fresh white cheese or butter.',
    'Petits pains frits et moelleux, servis au petit-déjeuner avec du fromage frais ou du beurre.',
    'Luftig frittiertes Brot, das zum Frühstück mit Frischkäse oder Butter serviert wird.',
    'Pães fritos e fofinhos, servidos no café da manhã com queijo branco ou manteiga.',
    'Pães fritos e fofos, servidos ao pequeno-almoço com queijo fresco ou manteiga.'
  ],
  'Pollo en Pepitoria Cubana':[
    'Chicken stewed in an egg-yolk, almond and saffron sauce, a Spanish culinary legacy in Cuba.',
    'Poulet mijoté dans une sauce aux jaunes d’œufs, aux amandes et au safran, héritage de la cuisine espagnole à Cuba.',
    'Hähnchen in einer Sauce aus Eigelb, Mandeln und Safran – ein Erbe der spanischen Küche in Kuba.',
    'Frango ensopado em molho de gemas, amêndoas e açafrão, herança da cozinha espanhola em Cuba.',
    'Frango estufado num molho de gemas, amêndoas e açafrão, herança da cozinha espanhola em Cuba.'
  ],
  'Pepitoria de Gallina':[
    'Hen in a sauce thickened with egg yolks, almonds, saffron and dry sherry.',
    'Poule en sauce liée aux jaunes d’œufs, aux amandes, au safran et au xérès sec.',
    'Huhn in einer mit Eigelb, Mandeln, Safran und trockenem Sherry gebundenen Sauce.',
    'Galinha em molho engrossado com gemas, amêndoas, açafrão e xerez seco.',
    'Galinha num molho engrossado com gemas, amêndoas, açafrão e xerez seco.'
  ]
};
for(const [index,locale] of locales.entries()){
  const file=path.join(dir,locale+'.json'),catalog=JSON.parse(fs.readFileSync(file,'utf8'));
  for(const dish of Object.values(catalog.dishes))if(descriptions[dish.name])dish.desc=descriptions[dish.name][index];
  fs.writeFileSync(file,JSON.stringify(catalog,null,2)+'\n');
}
