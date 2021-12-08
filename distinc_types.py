from typing import *


WebTemplate = NewType("WebTemplate", object)

JsonDict = NewType("JsonDict", str)

StructureMap = NewType("root.structures.structure_creator.StructureCreator", object)

LoadsMap = NewType("root.structures.structure_creator.LoadStructure", object)

StructureSystem = NewType("anastruct.fem.system.SystemElements", object)

StructureMember = NewType("root.structures.structure_creator.StructureElement", object)

AnastructLoadCombination = NewType("anastruct.fem.util.load.LoadCombination", object)

AnastructLoadCase = NewType("anastruct.fem.util.load.LoadCase", object)
