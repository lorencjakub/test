from flask import Blueprint

frame_structure_page = Blueprint("frame_structure_page", __name__, template_folder="templates")

import root.structures.server_validation
import root.structures.server_sent_events
import root.structures.frame_structure_thema
