from flask import Blueprint

section_page = Blueprint("section_page", __name__, template_folder="templates")

import root.sections.server_validation
import root.sections.server_sent_events
import root.sections.section_thema
