# Installer l'ancienne application ALINE sur macOS

Ce guide concerne l'application historique en Perl/Tk située dans
`aline_011208/`. Pour la nouvelle application Atlas, consulter plutôt le
`README.md`.

> ALINE date de 2008 et utilise X11. Son installation peut être délicate sur
> une version récente de macOS. Il est préférable d'utiliser un Perl installé
> avec Homebrew plutôt que le Perl fourni par macOS.

## 1. Installer les prérequis

Vérifier que [Homebrew](https://brew.sh/) est installé :

```bash
brew --version
```

Installer Perl, `cpanm` et XQuartz :

```bash
brew install perl cpanminus
brew install --cask xquartz
```

Après l'installation de XQuartz, fermer puis rouvrir la session macOS (ou
redémarrer le Mac), puis lancer XQuartz une première fois depuis le dossier
Applications.

## 2. Utiliser le Perl de Homebrew

Dans le terminal courant :

```bash
export PATH="$(brew --prefix perl)/bin:$PATH"
```

Pour conserver ce réglage dans les prochains terminaux :

```bash
echo 'export PATH="$(brew --prefix perl)/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

Vérifier le Perl utilisé :

```bash
which perl
perl --version
```

## 3. Installer Perl/Tk

```bash
cpanm Tk
```

Vérifier que le module est disponible :

```bash
perl -MTk -e 'print "Perl/Tk installé\n"'
```

## 4. Lancer ALINE

Se placer à la racine du dépôt :

```bash
cd /Users/noureddine/biochim-project
```

Lancer ALINE :

```bash
perl aline_011208/bin/aline
```

Ou ouvrir directement le fichier d'exemple :

```bash
perl aline_011208/bin/aline aline_011208/example/rada.aline
```

## Problèmes fréquents

### `Can't locate Tk.pm`

Le module Tk n'est pas installé pour le Perl actuellement utilisé. Vérifier
`which perl`, remettre le Perl de Homebrew dans le `PATH`, puis relancer :

```bash
cpanm Tk
```

### Erreur d'affichage X11

Vérifier que XQuartz est installé et ouvert. Après une première installation,
une fermeture de session ou un redémarrage est souvent nécessaire.

### Ne pas utiliser `runaline`

Le script `aline_011208/bin/runaline` contient un ancien chemin absolu :
`/usr/local/src/aline/bin/aline`. Dans ce dépôt, utiliser directement la
commande `perl aline_011208/bin/aline`.

## Sources utiles

- [Perl avec Homebrew](https://formulae.brew.sh/formula/perl)
- [XQuartz avec Homebrew](https://formulae.brew.sh/cask/xquartz)
- [Module Perl/Tk sur MetaCPAN](https://metacpan.org/dist/Tk)
