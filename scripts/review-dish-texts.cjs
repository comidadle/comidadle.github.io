const fs=require('node:fs'),path=require('node:path');
const dir=path.join(__dirname,'../locales/catalogs'),locales=['en','fr','de','pt-BR','pt-PT'];
// Correcciones editoriales de los platos reproducidos en las capturas.
const descriptions={
  'Pastelón de Plátano':[
    'Layers of sweet ripe plantain, minced meat and sofrito, topped with melted cheese and baked.',
    'Gratin de bananes plantains mûres, de viande hachée et de sofrito, recouvert de fromage doré au four.',
    'Auflauf aus süßen, reifen Kochbananen, Hackfleisch und Sofrito, mit Käse überbacken.',
    'Camadas de banana-da-terra madura, carne moída e refogado, cobertas com queijo e gratinadas no forno.',
    'Camadas de banana-pão madura, carne picada e refogado, cobertas com queijo e gratinadas no forno.'
  ],
  'Humita en Olla':[
    'Grated fresh corn simmered with onion, chilli and tomato, a creamy pot-cooked version of humita.',
    'Maïs frais râpé, mijoté avec de l’oignon, du piment et de la tomate : une version crémeuse de la humita, préparée en casserole.',
    'Frisch geriebener Mais, mit Zwiebeln, Chili und Tomaten im Topf gegart – eine cremige Variante der Humita.',
    'Milho verde ralado e cozido com cebola, pimenta e tomate, numa versão cremosa de humita feita na panela.',
    'Milho fresco ralado e cozido com cebola, malagueta e tomate, numa versão cremosa de humita feita na panela.'
  ],
  'Caldo de Costilla Bogotano':[
    'Clear beef rib broth with potatoes and coriander, traditionally eaten for breakfast in Bogotá after a night out.',
    'Bouillon clair de côtes de bœuf, de pommes de terre et de coriandre, traditionnellement servi au petit-déjeuner à Bogotá après une soirée festive.',
    'Klare Rinderrippenbrühe mit Kartoffeln und Koriander, in Bogotá traditionell als Frühstück nach einer durchfeierten Nacht serviert.',
    'Caldo claro de costela bovina com batata e coentro, tradicional no café da manhã de Bogotá depois de uma noite de festa.',
    'Caldo claro de costela de vaca com batata e coentros, tradicional ao pequeno-almoço em Bogotá depois de uma noite de festa.'
  ],
  'Tacu Tacu de Frijoles':[
    'A golden pan-fried cake of cooked white beans, rice and spices, crisp outside and soft inside.',
    'Galette de haricots blancs cuits, de riz et d’épices, dorée à la poêle, croustillante à l’extérieur et moelleuse à l’intérieur.',
    'Goldbraun gebratener Fladen aus gekochten weißen Bohnen, Reis und Gewürzen, außen knusprig und innen weich.',
    'Bolinho achatado de feijão-branco cozido, arroz e temperos, dourado na frigideira até ficar crocante por fora e macio por dentro.',
    'Bolinho achatado de feijão-branco cozido, arroz e especiarias, alourado na frigideira até ficar crocante por fora e macio por dentro.'
  ],
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
  'Pastelón de Plátano':{
    0:['Fried ripe plantain replaces the pasta sheets used in Italian lasagne.','Les tranches de banane plantain mûre et frite remplacent les feuilles de lasagnes italiennes.','Gebratene reife Kochbananen ersetzen die italienischen Lasagneblätter.','A banana-da-terra madura e frita substitui a massa da lasanha italiana.','A banana-pão madura e frita substitui as folhas de lasanha italiana.'],
    1:['The filling is minced meat cooked with Puerto Rican sofrito.','La farce se compose de viande hachée et de sofrito portoricain.','Die Füllung besteht aus Hackfleisch mit puerto-ricanischem Sofrito.','O recheio é de carne moída com refogado porto-riquenho.','O recheio é de carne picada com refogado porto-riquenho.'],
    2:['A layer of grated yellow cheese tops the dish and browns in the oven.','Une couche de fromage jaune râpé recouvre le plat et dore au four.','Eine Schicht geriebener gelber Käse bildet die überbackene Oberfläche.','Uma camada de queijo amarelo ralado cobre o prato e gratina no forno.','Uma camada de queijo amarelo ralado cobre o prato e gratina no forno.'],
    3:['It is a popular home-cooked dish for informal celebrations.','C’est un plat familial très apprécié lors des fêtes informelles.','Es ist ein beliebtes hausgemachtes Gericht für ungezwungene Feiern.','É um prato caseiro muito popular em festas informais.','É um prato caseiro muito popular em festas informais.'],
    4:['It bakes until the plantain caramelises and the cheese bubbles.','Il cuit au four jusqu’à ce que la banane plantain caramélise et que le fromage bouillonne.','Der Auflauf wird gebacken, bis die Kochbananen karamellisieren und der Käse Blasen wirft.','Vai ao forno até a banana-da-terra caramelizar e o queijo borbulhar.','Vai ao forno até a banana-pão caramelizar e o queijo borbulhar.']
  },
  'Humita en Olla':{
    0:['Unlike the classic wrapped humita, this version is cooked in a pot.','Contrairement à la humita classique enveloppée dans des feuilles, cette version se prépare en casserole.','Anders als die klassische eingewickelte Humita wird diese Variante im Topf gekocht.','Ao contrário da humita clássica embrulhada em folhas, esta versão é feita na panela.','Ao contrário da humita clássica embrulhada em folhas, esta versão é feita na panela.'],
    1:['The onion and tomato are sautéed before the grated corn is added.','L’oignon et la tomate sont revenus avant d’ajouter le maïs râpé.','Zwiebeln und Tomaten werden angedünstet, bevor der geriebene Mais dazukommt.','A cebola e o tomate são refogados antes de acrescentar o milho ralado.','A cebola e o tomate são refogados antes de se juntar o milho ralado.'],
    2:['This creamy version is especially popular in the Andean northwest.','Cette version crémeuse est particulièrement courante dans le nord-ouest andin.','Diese cremige Variante ist besonders im Nordwesten der Anden verbreitet.','Esta versão cremosa é especialmente comum no noroeste andino.','Esta versão cremosa é especialmente comum no noroeste andino.'],
    3:['Ground chilli gives it a reddish colour and gentle heat.','Le piment moulu lui donne une couleur rougeâtre et un goût légèrement relevé.','Gemahlene Chili sorgt für eine rötliche Farbe und milde Schärfe.','A pimenta moída dá a cor avermelhada e uma ardência suave.','A malagueta moída dá a cor avermelhada e um picante suave.'],
    4:['It is served hot as a starter during the colder months.','Elle est servie chaude en entrée pendant les mois froids.','In den kalten Monaten wird sie heiß als Vorspeise serviert.','É servida quente como entrada nos meses frios.','É servida quente como entrada nos meses frios.']
  },
  'Caldo de Costilla Bogotano':{
    0:['The bone-in ribs are put on to simmer in the early hours.','Les côtes avec os commencent à mijoter dès les premières heures du matin.','Die Rippen mit Knochen werden schon in den frühen Morgenstunden gekocht.','As costelas com osso começam a cozinhar ainda de madrugada.','As costelas com osso começam a cozer ainda de madrugada.'],
    1:['The broth stays clear while taking on flavour and collagen from the bones.','Le bouillon reste clair tout en se concentrant en saveur et en collagène issu des os.','Die Brühe bleibt klar und nimmt dabei Geschmack und Kollagen aus den Knochen auf.','O caldo fica claro e concentrado, com o sabor e o colágeno dos ossos.','O caldo fica claro e concentrado, com o sabor e o colagénio dos ossos.'],
    2:['Fresh coriander and small yellow criolla potatoes complete the broth.','La coriandre fraîche et les petites pommes de terre jaunes criollas complètent le bouillon.','Frischer Koriander und kleine gelbe Criolla-Kartoffeln ergänzen die Brühe.','Coentro fresco e pequenas batatas amarelas criollas completam o caldo.','Coentros frescos e pequenas batatas amarelas criollas completam o caldo.'],
    3:['Restaurants in Bogotá serve it for breakfast from four in the morning.','À Bogotá, certains restaurants le servent au petit-déjeuner dès quatre heures du matin.','In Bogotá servieren Restaurants die Brühe ab vier Uhr morgens zum Frühstück.','Em Bogotá, restaurantes servem o caldo no café da manhã a partir das quatro da madrugada.','Em Bogotá, há restaurantes que servem o caldo ao pequeno-almoço a partir das quatro da madrugada.'],
    4:['It is a popular restorative breakfast in the Colombian capital at weekends.','C’est un petit-déjeuner réconfortant très populaire le week-end dans la capitale colombienne.','Am Wochenende ist es ein beliebtes stärkendes Frühstück in der kolumbianischen Hauptstadt.','É um café da manhã reconfortante muito popular nos fins de semana na capital colombiana.','É um pequeno-almoço reconfortante muito popular ao fim de semana na capital colombiana.']
  },
  'Tacu Tacu de Frijoles':{
    0:['The white-bean version differs slightly from the black-bean version.','La version aux haricots blancs diffère légèrement de celle aux haricots noirs.','Die Variante mit weißen Bohnen unterscheidet sich leicht von der mit schwarzen Bohnen.','A versão de feijão-branco é um pouco diferente da versão de feijão-preto.','A versão de feijão-branco é um pouco diferente da versão de feijão-preto.'],
    1:['The mixture is flattened in a frying pan until crisp outside and soft inside.','Le mélange est aplati dans une poêle pour devenir croustillant à l’extérieur et moelleux à l’intérieur.','Die Masse wird in der Pfanne flach gedrückt, bis sie außen knusprig und innen weich ist.','A mistura é achatada na frigideira até ficar crocante por fora e macia por dentro.','A mistura é achatada na frigideira até ficar crocante por fora e macia por dentro.'],
    2:['Culantro, a broad-leaved herb with a coriander-like flavour, is mixed into the rice and beans.','Du culantro, herbe à larges feuilles au goût proche de la coriandre, est ajouté au mélange de riz et de haricots.','Culantro, ein breitblättriges Kraut mit korianderähnlichem Geschmack, wird unter die Reis-Bohnen-Masse gemischt.','Culantro, erva de folhas largas com sabor parecido com coentro, é misturado ao arroz e ao feijão.','Culantro, erva de folhas largas com sabor semelhante a coentros, é misturado com o arroz e o feijão.'],
    3:['In Lima, it is a popular way to turn leftovers into breakfast or lunch.','À Lima, c’est un plat apprécié au petit-déjeuner ou au déjeuner pour utiliser les restes.','In Lima werden damit gerne Reste zu einem Frühstück oder Mittagessen verarbeitet.','Em Lima, é uma forma popular de aproveitar sobras no café da manhã ou no almoço.','Em Lima, é uma forma popular de aproveitar sobras ao pequeno-almoço ou ao almoço.'],
    4:['It is served topped with a fried egg or stir-fried meat.','Il est servi avec un œuf au plat ou de la viande sautée par-dessus.','Serviert wird es mit einem Spiegelei oder kurz gebratenem Fleisch.','É servido com ovo frito ou carne salteada por cima.','É servido com ovo estrelado ou carne salteada por cima.']
  },
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
