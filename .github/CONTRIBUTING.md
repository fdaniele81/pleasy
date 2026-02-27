# 🤝 Come Contribuire a Pleasy

Grazie per il tuo interesse nel contribuire a Pleasy! Ogni contributo, grande o piccolo, è prezioso.

## 📋 Come Segnalare un Bug

1. **Cerca prima** nelle [issue esistenti](../../issues) per evitare duplicati
2. Usa il template **🐛 Bug Report** quando apri una nuova issue
3. Compila tutti i campi obbligatori — più dettagli ci dai, più velocemente possiamo risolvere
4. Allega screenshot e log se possibile

## ✨ Come Proporre una Feature

1. **Controlla le [Discussions](../../discussions/categories/ideas)** — forse qualcuno ha già avuto la stessa idea
2. Per idee ancora vaghe → apri una **Discussion** nella categoria "Ideas"
3. Per proposte concrete → usa il template **✨ Feature Request**
4. Includi il contesto: che problema risolve? Chi ne beneficia?

## 🔀 Come Contribuire con Codice

### Setup locale

```bash
# Fork e clone
git clone https://github.com/[YOUR_USERNAME]/pleasy.git
cd pleasy

# Installa le dipendenze
npm install

# Avvia in development
npm run dev
```

### Workflow

1. **Crea un branch** dal `main`:
   ```bash
   git checkout -b feature/nome-feature
   # oppure
   git checkout -b fix/nome-bug
   ```

2. **Sviluppa** la tua modifica seguendo le convenzioni del progetto

3. **Testa** le tue modifiche:
   ```bash
   npm run test
   npm run lint
   ```

4. **Committa** con messaggi chiari (usiamo [Conventional Commits](https://www.conventionalcommits.org/)):
   ```
   feat: aggiunta esportazione Gantt in PDF
   fix: risolto crash su drag & drop task vuoti
   docs: aggiornata guida installazione
   ```

5. **Apri una Pull Request** verso `main` con:
   - Descrizione chiara delle modifiche
   - Link alla issue correlata (es. `Closes #42`)
   - Screenshot se ci sono modifiche UI

### Convenzioni di codice

- **Lingua del codice**: inglese (variabili, funzioni, commenti nel codice)
- **Lingua della UI**: italiano (con supporto i18n per future traduzioni)
- **Formattazione**: ESLint + Prettier (configurati nel progetto)
- **Test**: aggiungi test per nuove feature e bug fix

## 🏷️ Come Gestiamo le Issue

| Label | Significato |
|-------|-------------|
| `bug` | Bug confermato |
| `enhancement` | Nuova feature o miglioramento |
| `triage` | In fase di valutazione |
| `good first issue` | Perfetta per chi inizia a contribuire |
| `help wanted` | Cerchiamo aiuto dalla community |
| `priority: critical` | Da risolvere subito |
| `priority: high` | Prossimo sprint |
| `priority: medium` | Nel backlog |
| `priority: low` | Nice to have |
| `wontfix` | Non verrà implementato (con spiegazione) |
| `duplicate` | Duplicato di un'altra issue |

## 📐 Processo di Review

1. Ogni PR viene revisionata prima del merge
2. Ci impegniamo a dare un primo feedback entro **48 ore**
3. Le PR devono passare tutti i check automatici (lint, test, build)
4. Modifiche significative richiedono almeno 1 review approvata

## 💡 Altre Modalità di Contributo

Non sai programmare? Puoi comunque aiutare:

- **Documentazione**: migliora guide, README, wiki
- **Traduzioni**: aiutaci a portare Pleasy in altre lingue
- **Design**: proponi mockup e miglioramenti UI/UX
- **Testing**: prova le release candidate e segnala problemi
- **Community**: rispondi alle domande nelle Discussions

## 📜 Codice di Condotta

Partecipando al progetto ti impegni a mantenere un ambiente rispettoso e inclusivo. Comportamenti tossici, discriminatori o molesti non saranno tollerati.

---

Grazie per far parte della community di Pleasy! 🚀
