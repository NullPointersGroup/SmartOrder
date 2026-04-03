from abc import ABC, abstractmethod

class AbstractCommand(ABC):
   name: str
   desc: str
   
   def __init__(self, name: str, desc: str) -> None:
      self.name = name
      self.desc = desc