"""Ejecuta los pasos de preparación en orden; conserva resultados para reanudar."""
from pathlib import Path
import subprocess
import sys

root=Path(__file__).resolve().parent.parent
for locale in ["en","fr","de","pt-BR","pt-PT"]:
    result=subprocess.run([sys.executable,str(root/"scripts/generate-translations.py"),locale,"--batch","64"],cwd=root)
    if result.returncode:sys.exit(result.returncode)
for command in [[sys.executable,str(root/"scripts/translate-dish-names.py")],["node",str(root/"scripts/adapt-pt-pt.cjs")],["node",str(root/"scripts/review-dish-names.cjs")],["node",str(root/"scripts/review-dish-texts.cjs")]]:
    result=subprocess.run(command,cwd=root)
    if result.returncode:sys.exit(result.returncode)
