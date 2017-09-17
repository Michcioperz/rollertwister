let main = document.getElementsByTagName('main')[0]
fetch('/list').then(resp => resp.json()).then((series) => {
  series.forEach((serie) => {
    let card = document.createElement('div')
    card.classList.add('mdl-card')
    card.classList.add('mdl-shadow--2dp')
    let cardTitleBox = document.createElement('div')
    cardTitleBox.classList.add('mdl-card__title')
    cardTitleBox.classList.add('mdl-card--expand')
    let cardTitle = document.createElement('h4')
    cardTitle.classList.add('mdl-card__title-text')
    cardTitle.textContent = serie.Title
    cardTitleBox.appendChild(cardTitle)
    if (serie.Alt !== "") {
      let cardAlt = document.createElement('span')
      cardAlt.classList.add('mdl-card__subtitle-text')
      cardAlt.textContent = serie.Alt
      cardTitleBox.appendChild(cardAlt)
    }
    card.appendChild(cardTitleBox)
    let cardActionBox = document.createElement('div')
    cardActionBox.classList.add('mdl-card__actions')
    cardActionBox.classList.add('mdl-card--border')
    let cardAction = document.createElement('a')
    cardAction.classList.add('mdl-button')
    cardAction.classList.add('mdl-button--colored')
    cardAction.classList.add('mdl-js-button')
    cardAction.classList.add('mdl-js-ripple-effect')
    cardAction.textContent = 'Episodes list'
    cardAction.addEventListener('click', (e) => {
      fetch('/detail/' + serie.Slug).then(r => r.json()).then((eps) => {
        let dialog = document.createElement('dialog')
        dialog.classList.add('mdl-dialog')
        let dialogTitle = document.createElement('h4')
        dialogTitle.classList.add('mdl-dialog__title')
        dialogTitle.textContent = serie.Title
        dialog.appendChild(dialogTitle)
        let dialogActions = document.createElement('div')
        dialogActions.classList.add('mdl-dialog__actions')
        eps.forEach((ep) => {
          let episodeButton = document.createElement('button')
          episodeButton.type = 'button'
          episodeButton.classList.add('mdl-button')
          episodeButton.textContent = 'Episode ' + ep.Number
          episodeButton.addEventListener('click', () => {
            fetch('/play/' + serie.Slug + '/' + ep.Number).then((pr) => {
              switch (pr.status) {
                case 200:
                  main.MaterialSnackbar.showSnackbar({timeout: 2000, message: serie.Title + ' ' + e.Number + ': Added to queue'})
                  break
                case 429:
                  main.MaterialSnackbar.showSnackbar({timeout: 2000, message: 'Queue is full'})
                  break
                default:
                  console.log(pr)
              }
            })
          })
          dialogActions.appendChild(episodeButton)
        })
        let closeButton = document.createElement('button')
        closeButton.type = 'button'
        closeButton.classList.add('mdl-button')
        closeButton.classList.add('close')
        closeButton.textContent = 'Close'
        closeButton.addEventListener('click', () => {
          dialog.close()
        })
        dialogActions.appendChild(closeButton)
        dialog.appendChild(dialogActions)
        main.appendChild(dialog)
        if (!dialog.showModal) {
          dialogPolyfill.registerDialog(dialog)
        }
        dialog.showModal()
      })
    })
    cardActionBox.appendChild(cardAction)
    card.appendChild(cardActionBox)
    main.appendChild(card)
  })
})
