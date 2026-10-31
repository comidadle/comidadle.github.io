"""Genera borradores estáticos mediante OPUS-MT/CTranslate2 en CPU local.

Requisitos de preparación (no del juego): ctranslate2 y sentencepiece.
Los modelos y resultados intermedios se guardan en .translation-cache, fuera de Git.
"""
import sys
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
sys.path.insert(0,str(ROOT/".translation-cache/python"))
import argparse
import hashlib
import json
import re
import time
import urllib.request
import subprocess

parser=argparse.ArgumentParser()
parser.add_argument("locale",choices=["en","fr","de","pt-BR","pt-PT"])
parser.add_argument("--limit",type=int,default=None)
parser.add_argument("--batch",type=int,default=32)
args=parser.parse_args()
locale=args.locale
if locale=="pt-PT":
    sys.exit(subprocess.run(["node",str(ROOT/"scripts/adapt-pt-pt.cjs")],cwd=ROOT).returncode)
import ctranslate2
import sentencepiece
model_name="opus-mt-es-en" if locale=="en" else "opus-mt-en-de" if locale=="de" else "opus-mt-en-ROMANCE"
model_dir=ROOT/".translation-cache/ct2"/model_name
model_dir.mkdir(parents=True,exist_ok=True)
for name in ["config.json","model.bin","shared_vocabulary.txt","source.spm","target.spm"]:
    target=model_dir/name
    if not target.exists():
        print("Descargando modelo:",model_name,name,flush=True)
        with urllib.request.urlopen(f"https://huggingface.co/michaelfeil/ct2fast-{model_name}/resolve/main/{name}",timeout=120) as response:
            temporary=target.with_suffix(target.suffix+".part")
            with temporary.open("wb") as output:
                while chunk:=response.read(1024*1024):output.write(chunk)
        temporary.replace(target)

source=json.loads((ROOT/"locales/catalogs/es.json").read_text(encoding="utf-8"))
cache_dir=ROOT/".translation-cache/results"
cache_dir.mkdir(parents=True,exist_ok=True)
cache_file=cache_dir/f"{locale}.json"
cache=json.loads(cache_file.read_text(encoding="utf-8")) if cache_file.exists() else {}
english=json.loads((cache_dir/"en.json").read_text(encoding="utf-8")) if locale!="en" else None
identifier=lambda text:hashlib.sha256(text.encode()).hexdigest()
unique={}
def collect(value):
    if isinstance(value,str):unique[identifier(value)]=value
    elif isinstance(value,dict):
        for item in value.values():collect(item)
    elif isinstance(value,list):
        for item in value:collect(item)
collect(source["ui"]);collect(source["dishes"])
glossary=json.loads((ROOT/"i18n/culinary-glossary.json").read_text(encoding="utf-8"))
glossary_revision=identifier(json.dumps(glossary,ensure_ascii=False,sort_keys=True))
terms={term.lower():None for term in glossary["properTerms"]}
terms.update({term.lower():values for term,values in glossary["terms"].items()})
if locale!="en":
    for values in glossary["terms"].values():terms[values["en"].lower()]=values
term_pattern=re.compile(r"\b(?:"+"|".join(re.escape(term) for term in sorted(terms,key=len,reverse=True))+r")\b",re.IGNORECASE)
common_pattern=re.compile(r"\b(?:"+"|".join(re.escape(term) for term in glossary["terms"])+r")\b",re.IGNORECASE)
for key,entry in list(cache.items()):
    if key in unique and term_pattern.search(unique[key]) and entry.get("glossaryRevision")!=glossary_revision:del cache[key]
    elif locale!="en" and key in unique and common_pattern.search(unique[key]) and entry.get("commonTermsRevision")!=1:del cache[key]
    elif key in unique and re.search(r"https?://|comidadle\.github\.io|@aanxs404",unique[key]) and entry.get("linkProtection")!=1:del cache[key]
for dish in source["dishes"].values():
    # Los nombres tradicionales son nombres propios; las descripciones y pistas sí se traducen.
    name=dish["name"];cache[identifier(name)]={"text":name,"source":name,"reviewFlags":["traditional-name"],"glossaryRevision":glossary_revision}
pending=[(key,value) for key,value in unique.items() if key not in cache]
if args.limit is not None:pending=pending[:args.limit]
print(f"{locale}: {len(cache)} textos guardados; {len(pending)} pendientes",flush=True)
translator=ctranslate2.Translator(str(model_dir),device="cpu",compute_type="int8",intra_threads=4,inter_threads=1) if pending else None
encoder=sentencepiece.SentencePieceProcessor(model_file=str(model_dir/"source.spm")) if pending else None
decoder=sentencepiece.SentencePieceProcessor(model_file=str(model_dir/"target.spm")) if pending else None
prefix={"fr":">>fr<<","pt-BR":">>pt_BR<<","pt-PT":">>pt_PT<<"}.get(locale)
def translate(texts):
    tokens=[([prefix] if prefix else [])+encoder.encode(text,out_type=str)+["</s>"] for text in texts]
    outputs=translator.translate_batch(tokens,beam_size=2,max_decoding_length=160,repetition_penalty=1.1)
    return [decoder.decode(output.hypotheses[0]) for output in outputs]

marker=re.compile(r"https?://[^\s]+|[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:io|com|org)(?:/[^\s]*)?|@[A-Za-z0-9_]+|\{\w+\}|</?(?:strong|em|br)\s*/?>|Comidadle|[\U0001F000-\U0001FAFF\u2600-\u27BF](?:[\ufe0f\u200d\U0001F000-\U0001FAFF\u2600-\u27BF])*",re.UNICODE|re.IGNORECASE)
def protect(text):
    values=[]
    def protect_term(match):
        translations=terms[match.group().lower()]
        value=translations[locale] if translations else match.group()
        values.append(value);return f" {9000+len(values)-1} "
    text=term_pattern.sub(protect_term,text)
    def replace(match):
        values.append(match.group());return f" {9000+len(values)-1} "
    return marker.sub(replace,text),values
def restore(text,values):
    for index,value in enumerate(values):
        pattern=r"[\s,.]*".join(str(9000+index))
        if not re.search(pattern,text):return None
        text=re.sub(r"\s*"+pattern+r"\s*",lambda _:" "+value+" ",text)
    return re.sub(r"\s+([.,;!?])",r"\1",re.sub(r"([.!?])\1+",r"\1",text)).strip()
def render(value):
    if isinstance(value,str):return cache.get(identifier(value),{}).get("text")
    if isinstance(value,list):
        results=[render(item) for item in value]
        return results if all(item is not None for item in results) else None
    results={key:render(item) for key,item in value.items()}
    return results if all(item is not None for item in results.values()) else None
def save():
    file=ROOT/f"locales/catalogs/{locale}.json"
    draft=json.loads(file.read_text(encoding="utf-8"))
    draft.update(sourceRevision=source["sourceRevision"],status="draft",applicationCoverageReviewed=False,generatedWith=f"OPUS-MT/{model_name}; CTranslate2 int8",generationComplete=False)
    draft["ui"]={key:value for key,value in draft["ui"].items() if key in source["ui"]}
    for key,value in source["ui"].items():
        if not key.startswith("msg_") and key in draft["ui"]:continue
        result=render(value)
        if result is not None:draft["ui"][key]=result
    for key,value in source["dishes"].items():
        result=render(value)
        if result is not None:draft["dishes"][key]=result
    draft["generationComplete"]=len(draft["ui"])==len(source["ui"]) and len(draft["dishes"])==len(source["dishes"])
    for target,data,indent in [(file,draft,2),(cache_file,cache,None)]:
        temporary=target.with_suffix(target.suffix+".tmp")
        temporary.write_text(json.dumps(data,ensure_ascii=False,indent=indent)+"\n",encoding="utf-8")
        temporary.replace(target)

started=time.monotonic()
try:
    for offset in range(0,len(pending),args.batch):
        batch=pending[offset:offset+args.batch]
        inputs=[text if locale=="en" else english[key]["text"] for key,text in batch]
        protected=[protect(text) for text in inputs]
        results=translate([item[0] for item in protected])
        for (key,original),(input_text,values),output in zip(batch,protected,results):
            text=restore(output,values);flags=[]
            if text is None:
                # Nunca perder un parámetro, una etiqueta o un icono por una predicción del modelo.
                fragments=re.split(r"(90\d\d)",input_text)
                plain=[value for value in fragments if value.strip() and not re.fullmatch(r"90\d\d",value)]
                translated=iter(translate(plain))
                text="".join(values[int(value)-9000] if re.fullmatch(r"90\d\d",value) and int(value)-9000<len(values) else next(translated) if value.strip() else " " for value in fragments).strip()
                flags.append("fragmented-placeholder-fallback")
            if not re.search(r"[.!?]$",original):text=re.sub(r"[.!?]+$","",text)
            if locale=="en" and re.search(r"des(?:hebrad|mechad)[oa]",original,re.I):text=re.sub(r"\btorn\b","shredded",text,flags=re.I)
            cache[key]={"text":text,"source":original,"reviewFlags":flags,"glossaryRevision":glossary_revision,"commonTermsRevision":1,"linkProtection":1}
        save()
        print(f"{locale}: {min(offset+args.batch,len(pending))}/{len(pending)}; {time.monotonic()-started:.1f} s",flush=True)
finally:save()
