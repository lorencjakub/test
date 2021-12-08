from flask import render_template, jsonify
import sqlalchemy
from sqlalchemy.exc import SQLAlchemyError
from root import app


def error_404(error):
    return render_template("404.html"), 404


@app.errorhandler(SQLAlchemyError)
def db_error(err):
    if isinstance(err, sqlalchemy.exc.InternalError):
        return "Chyba připojení k databázi!", 400


class AuthError(Exception):
    code = 403
    description = "Tato operace je přístupná pouze přihlášenému uživateli!"


class WrongDataError(Exception):
    code = 400
    description = "Nečitelná data!"


class SectionGeometryError(Exception):
    code = 400
    description = "Chyba v zadání geometrie. Možné příčiny:\n" \
                  "- chybně určená dutina na složeném průřezu\n" \
                  "- překrývající se geometrie na složeném průřezu" \
                  "- neuzavřený graficky definovaný průřez\n"


class SaveLimit(Exception):
    code = 403
    description = "Plné úložiště! Současně můžeš mít uloženo maximálně 5 průřezů, 2 konstrukce a 10 materiálů."


class FigureError(Exception):
    code = 400
    description = "Neočekávaná chyba při tisku výsledkových obrázků!"


class InputValidateError(Exception):
    code = 200
    description = "Jeden nebo více vstupů byl zadán špatně!"


@app.errorhandler(Exception)
def request_error(err):
    try:
        return err.description, err.code

    except AttributeError:
        print(err)
        return "Neočekávaná chyba!", 400
