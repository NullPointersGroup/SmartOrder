from src.commands.AbstractCommand import AbstractCommand

class DuplicaComand(AbstractCommand):
   def __init__(self):
      super().__init__("duplica", "Duplica l'ultimo ordine effettuato. Se hai dubbi sui dettagli del tuo ultimo ordine, visualizza la sezione 'Storico Ordini'.")
      
class DuplicaXXComand(AbstractCommand):
   def __init__(self):
      super().__init__("duplicaxx", "Duplica l'ordine con il codice che inserisci, se hai dubbi sul codice visualizza la sezione 'Storico Ordini'.")
      
class CarrelloComand(AbstractCommand):
   def __init__(self):
      super().__init__("carrello", "Visualizza gli elementi presenti attualmente nel tuo carrello.")
      
class InviaComand(AbstractCommand):
   def __init__(self):
      super().__init__("invia", "Invia l'ordine, che contiene tutti gli elementi presenti nel tuo carrello. Se hai dubbi su cosa è presente, consulta il carrello nella sezione di destra dedicata.")
      
class AnnullaComand(AbstractCommand):
   def __init__(self):
      super().__init__("annulla", "Annulla la disambiguazione in corso.")
   
class ComandiComand(AbstractCommand):
   def __init__(self):
      super().__init__("comandi", "Visualizza la spiegazione di tutti i comandi.")
      
class ScimmiaComand(AbstractCommand):
   def __init__(self):
      super().__init__("comandi", "Il teorema delle scimmie infinite afferma che una scimmia che batte a caso i tasti di una macchina da scrivere per un tempo infinito prima o poi scriverà qualsiasi testo, come l'intera opera di Shakespeare.")