const fs=require('node:fs'),path=require('node:path');
const dir=path.join(__dirname,'../locales/catalogs'),locales=['en','fr','de','pt-BR','pt-PT'];
// Correcciones editoriales de los platos reproducidos en las capturas.
const descriptions={
  'Moqueca de Camarão':[
    'Fresh shrimp in a sauce of coconut milk, dendê oil, tomato and bell pepper, in the style of Bahia.',
    'Crevettes fraîches en sauce au lait de coco, à l’huile de dendê, à la tomate et au poivron, à la manière de Bahia.',
    'Frische Garnelen in einer Sauce aus Kokosmilch, Dendê-Öl, Tomaten und Paprika nach Art von Bahia.',
    'Camarões frescos em molho de leite de coco, dendê, tomate e pimentão, na versão baiana.',
    'Camarões frescos num molho de leite de coco, dendê, tomate e pimento, na versão baiana.'
  ],
  'Carapulcra Chinchana':[
    'A stew of dried potatoes, pork, red chilli and roasted peanuts, a colonial-era dish from Chincha.',
    'Ragoût de pommes de terre séchées au porc, au piment rouge et aux cacahuètes grillées, plat de l’époque coloniale originaire de Chincha.',
    'Eintopf aus getrockneten Kartoffeln, Schweinefleisch, roter Chili und gerösteten Erdnüssen, ein Gericht aus der Kolonialzeit aus Chincha.',
    'Ensopado de batata seca com carne de porco, pimenta vermelha e amendoim torrado, prato colonial de Chincha.',
    'Guisado de batata seca com carne de porco, malagueta vermelha e amendoim torrado, prato colonial de Chincha.'
  ],
  "Shepherd's Pie":[
    'Minced lamb stew with vegetables, topped with mashed potatoes and browned in the oven.',
    'Hachis d’agneau aux légumes, recouvert de purée de pommes de terre et gratiné au four.',
    'Lammhackfleisch mit Gemüse, mit Kartoffelpüree bedeckt und im Ofen überbacken.',
    'Ensopado de carne de cordeiro moída com legumes, coberto de purê de batata e gratinado no forno.',
    'Guisado de borrego picado com legumes, coberto de puré de batata e gratinado no forno.'
  ],
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
const hints={
  'Moqueca de Camarão':{
    4:['It is one of the most popular starters in the country’s restaurants serving food from Bahia.','C’est l’une des entrées les plus demandées dans les restaurants de cuisine de Bahia du pays.','Es gehört zu den beliebtesten Vorspeisen in den Restaurants des Landes mit Küche aus Bahia.','É uma das entradas mais pedidas nos restaurantes de cozinha baiana do país.','É uma das entradas mais pedidas nos restaurantes de cozinha baiana do país.']
  },
  'Carapulcra Chinchana':{
    3:['Carapulcra is served alongside sopa seca at celebrations in Chincha.','La carapulcra accompagne la sopa seca lors des fêtes de Chincha.','Bei Festen in Chincha wird Carapulcra zusammen mit Sopa seca serviert.','A carapulcra é servida com sopa seca nas celebrações de Chincha.','A carapulcra é servida com sopa seca nas celebrações de Chincha.']
  }
};
const frenchHints={
  'Moqueca de Camarão':['Elle se distingue de la moqueca de Bahia par sa garniture principale : les crevettes.','Les crevettes sont ajoutées pendant les cinq dernières minutes pour éviter qu’elles durcissent.','Le lait de coco et l’huile de dendê forment sa base aromatique.','Elle est servie avec du riz blanc et du pirão de poisson à Salvador de Bahia.','C’est l’une des entrées les plus demandées dans les restaurants de cuisine de Bahia du pays.'],
  'Carapulcra Chinchana':['La papa seca, pomme de terre séchée des Andes, constitue la base du ragoût.','Chincha, au sud de Lima, est la ville qui revendique particulièrement ce ragoût.','Les cacahuètes grillées et moulues lui donnent son onctuosité et sa saveur caractéristique.','La carapulcra accompagne la sopa seca lors des fêtes de Chincha.','C’est l’un des plus anciens plats de la cuisine de Lima à base de pommes de terre séchées.'],
  "Shepherd's Pie":["Le nom shepherd’s pie désigne la version à l’agneau, et non celle au bœuf.",'La version au bœuf porte le nom de cottage pie.','La purée qui recouvre la viande forme une croûte dorée au four.','C’est un plat du dimanche préparé avec les restes dans les foyers anglais.','La sauce Worcestershire lui apporte sa profonde saveur umami.']
};
for(const [index,locale] of locales.entries()){
  const file=path.join(dir,locale+'.json'),catalog=JSON.parse(fs.readFileSync(file,'utf8'));
  for(const dish of Object.values(catalog.dishes)){
    if(descriptions[dish.name])dish.desc=descriptions[dish.name][index];
    for(const [hint,values] of Object.entries(hints[dish.name]||{}))dish.hints[Number(hint)]=values[index];
    if(locale==='fr'&&frenchHints[dish.name])dish.hints=frenchHints[dish.name];
  }
  fs.writeFileSync(file,JSON.stringify(catalog,null,2)+'\n');
}
