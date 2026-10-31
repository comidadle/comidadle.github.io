"""Lectura del catálogo público de tienda; no lee perfiles ni modifica Supabase."""
import json
from pathlib import Path
import re
import urllib.request
root=Path(__file__).resolve().parent.parent
source=(root/"index.html").read_text(encoding="utf-8")
base=re.search(r'const SB="([^"]+)"',source).group(1)
key=re.search(r'const SK="([^"]+)"',source).group(1)
request=urllib.request.Request(base+"/rest/v1/shop_items?select=id,name,description,category,value",headers={"apikey":key,"Authorization":"Bearer "+key})
with urllib.request.urlopen(request,timeout=30) as response:data=json.load(response)
if not isinstance(data,list):raise RuntimeError("El catálogo no es una lista.")
data.sort(key=lambda item:str(item["id"]))
(root/"locales/source/shop.json").write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print("Artículos públicos de la tienda:",len(data))
