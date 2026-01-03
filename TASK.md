Aufgabe:

Es soll eine Weboberfläche erstellt werden die sowohl in einer Desktop- als auch Mobile-Umgebung funktionieren soll.

Die App soll Kanu, Kajak bzw. auch SUP-Einsetzpunkte verwalten können. Die Daten sollen Personenbezogen gespeichert und auf einer Karte (Openstreetmaps) einsehbar sein. Auf dieser Karte sollen alle Punkte, die von den jeweiligen Accounts erstellt wurden einsehbar bzw. filterbar sein. ("Meine Punkte", "Offizielle Punkte", "username")

Bitte folgende Features Implementieren:
* Die Anwendung soll mit Vue.JS und Typescript umgesetzt werden (Boilerplate besteht bereits)
* Datenbank für die Useraccounts und Einsetzpunkte in SQLite
    * Datenbank soll direkt in "data"-Verzeichnis im Repo gespeichert werden (bitte nicht einchecken)
* Backend soll mittels Express.JS auf die Datenbank zugreifen
* Signup bzw. Login für User implementieren (eMail, username, password)
* Karte (Openstreetmaps) nach Login anzeigen
* Filterfunktion ("Meine Punkte", "Offizielle Punkte", "username")
* Anzeige je nach Kategorie ("Kajak", "SUP", "Schwimmen", "Entspannen") => Mehrfachauswahl möglich (Checkbox)
* Impressum (erstmal mit Platzhaltern)
* Für jeden Einsetzpunkt sollen folgende Informationen eintragbar sein:
    * Stationen Öffentlicher Verkehrsmittel (inkl. Entfernung) in der Nähe (maximal 5 Stück eintragbar)
    * Parkmöglichkeiten Verkehrsmittel
    * Hinweise (Freitext)
    * Öffnungszeiten (optional, standardmäßih 24h)
    * Gewässer in unmittelbarer Nähe (Parkmöglichkeiten)
    * Lebensmittelversorgung (Parkmöglichkeiten)
    * Kategorie des Einsetzpunktes "Kajak", "SUP", "Schwimmen", "Entspannen" (Merhfachauswahl möglich)
    * Erstell von (username)
    * Einsetzpunk löschen (Darf nur der Ersteller oder Admin)
* Bitte Logik in Composables und States in Pinia verwalten