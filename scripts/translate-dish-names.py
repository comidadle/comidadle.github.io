"""Traduce títulos descriptivos sin sustituir los nombres canónicos del juego."""
import sys,json,re,time
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
sys.path.insert(0,str(ROOT/'.translation-cache/python'))
import ctranslate2,sentencepiece
source=json.loads((ROOT/'locales/catalogs/es.json').read_text(encoding='utf-8'))
names=list(dict.fromkeys(d['name'] for d in source['dishes'].values()))
proper=['Tacos al Pastor','Lomo Saltado','Ropa Vieja','Moros y Cristianos','Dulce de Leche','Leche de Tigre','Tres Leches','Gallo Pinto','Pabellón Criollo','Pão de Queijo','Baião de Dois','Feijão Tropeiro','Fish and Chips',"Shepherd's Pie",'Mac and Cheese','Pastéis de Nata','Bacalhau à Brás','Crème Brûlée','Pizza Margherita','Pasta alla Carbonara','Dim Sum','Mapo Tofu','Döner Kebab','Pho Bo','Bánh Mì','Pad Thai','Tom Yum Goong','Nasi Goreng','Nasi Lemak','Jerk Chicken','Ackee and Saltfish','Ghormeh Sabzi','Nyama Choma','Hainanese Chicken Rice','Groundnut Soup']
generic=set('Arroz Sopa Caldo Caldillo Pollo Pescado Carne Cerdo Ternera Cordero Costilla Costillas Ensalada Torta Tarta Pastel Pastelón Pasteles Pan Panes Huevos Huevo Fideos Leche Dulce Flan Pato Queso Papas Patatas Puré Guiso Estofado Asado Cazuela Caldereta Filete Lomo Lomos Cochinillo Lechón Jamón Albóndigas Albondiguitas Hamburguesa Helado Helados Nieve Batido Licuado Agua Chocolate Café Espinacas Garbanzos Frijoles Habichuelas Porotos Maíz Choclo Mazorca Plátano Plátanos Yuca Camarón Camarones Langosta Pulpo Calamares Cangrejo Bacalao Mariscos Pimientos Chiles Chicharrón Chicharrones Empanada Empanadas Tortilla Tortillas Tamal Tamales Tamale Tostadas Tostones Arepa Arepas Ceviche Paella Sancocho Milanesa Milanesas Churrasco Brochetas Pinchos Bollo Bollos Bolón Sándwich Enchiladas Salsa Salsas Fondue Gaufre Sopa Caldo Rellenitos Tortitas Croquetas Budín Bizcocho Natilla Pudin Cuy Conejo Pavo Lengua Chivo Cabrito Sémola Quinua Atol Atole Pescadito Pescaditos'.split())
for name in names:
    first=name.split()[0]
    if first not in generic and first not in proper:proper.append(first)
proper.sort(key=len,reverse=True)
pattern=re.compile(r'(?<!\w)(?:'+'|'.join(re.escape(p) for p in proper)+r')(?!\w)',re.I)
cache_dir=ROOT/'.translation-cache/name-results';cache_dir.mkdir(parents=True,exist_ok=True)
def protect(text):
    values=[]
    def replace(m):values.append(m.group());return ' '+str(9000+len(values)-1)+' '
    return pattern.sub(replace,text),values
def restore(text,values):
    for i,value in enumerate(values):
        marker=r'[\s,.]*'.join(str(9000+i))
        if not re.search(marker,text):return None
        text=re.sub(marker,lambda m:value,text)
    return re.sub(r'\s+([,.;:!?])',r'\1',re.sub(r'\s+',' ',text)).strip().rstrip('.')
for locale in ['en','fr','de','pt-BR']:
    file=cache_dir/(locale+'.json');cache=json.loads(file.read_text(encoding='utf-8')) if file.exists() else {}
    english=json.loads((cache_dir/'en.json').read_text(encoding='utf-8')) if locale!='en' else None
    pending=[n for n in names if n not in cache]
    model='opus-mt-es-en' if locale=='en' else 'opus-mt-en-de' if locale=='de' else 'opus-mt-en-ROMANCE'
    directory=ROOT/'.translation-cache/ct2'/model
    translator=ctranslate2.Translator(str(directory),device='cpu',compute_type='int8',intra_threads=4) if pending else None
    encoder=sentencepiece.SentencePieceProcessor(model_file=str(directory/'source.spm')) if pending else None
    decoder=sentencepiece.SentencePieceProcessor(model_file=str(directory/'target.spm')) if pending else None
    prefix={'fr':'>>fr<<','pt-BR':'>>pt_BR<<'}.get(locale)
    for offset in range(0,len(pending),64):
        batch=pending[offset:offset+64];prepared=[protect(n if locale=='en' else english[n]) for n in batch]
        tokens=[([prefix] if prefix else [])+encoder.encode(text,out_type=str)+['</s>'] for text,_ in prepared]
        results=translator.translate_batch(tokens,beam_size=1,max_decoding_length=48,repetition_penalty=1.1)
        for name,(_,values),out in zip(batch,prepared,results):
            translated=restore(decoder.decode(out.hypotheses[0]),values)
            # Ante un fallo del modelo, mantener el nombre auténtico; nunca mostrar marcadores.
            cache[name]=translated if translated and not re.search(r'90\d\d',translated) else name
        file.write_text(json.dumps(cache,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
        print(locale,min(offset+64,len(pending)),len(pending),flush=True)
    catalog_file=ROOT/f'locales/catalogs/{locale}.json';catalog=json.loads(catalog_file.read_text(encoding='utf-8'))
    for id,dish in source['dishes'].items():catalog['dishes'][id]['displayName']=cache[dish['name']]
    catalog_file.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
