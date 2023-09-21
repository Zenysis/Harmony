#!/bin/bash -e
# Installs ipython locally (not in venv) so you can create new notebooks in
# `jupyter notebook`.

python -m pip install ipykernel
python -m ipykernel install
