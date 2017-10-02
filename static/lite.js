let seriesList = document.getElementById('series-list')
let dialogOverlay = document.getElementById('dialog-overlay')
function quickAlert (content) {
  let alert = document.createElement('div')
  alert.classList.add('dialog')
  alert.classList.add('alert')
  let alertText = document.createElement('h2')
  alertText.textContent = content
  alert.appendChild(alertText)
  let alertButton = document.createElement('button')
  alertButton.classList.add('close')
  alertButton.type = 'button'
  alertButton.textContent = 'Close'
  alertButton.addEventListener('click', () => {
    alert.parentNode.removeChild(alert)
  })
  alert.appendChild(alertButton)
  dialogOverlay.appendChild(alert)
}
function loadingAlert (content) {
  let alert = document.createElement('div')
  alert.classList.add('dialog')
  alert.classList.add('loading')
  let alertText = document.createElement('h3')
  alertText.textContent = content
  alert.appendChild(alertText)
  dialogOverlay.appendChild(alert)
  return alert
}
let globalLoader = loadingAlert('Fetching anime list…')
fetch('/list').then(resp => resp.json()).then((series) => {
  globalLoader.parentNode.removeChild(globalLoader)
  let searchBox = document.createElement('input')
  searchBox.setAttribute('id', 'search-box')
  searchBox.addEventListener('submit', () => false)
  searchBox.addEventListener('input', () => {
    for (let elem of seriesList.children) {
      elem.classList.remove('filtered')
      if (!elem.textContent.toLowerCase().includes(searchBox.value.toLowerCase())) {
        elem.classList.add('filtered')
      }
    }
  })
  dialogOverlay.insertBefore(searchBox, dialogOverlay.firstElementChild)
  series.forEach((serie) => {
    let card = document.createElement('section')
    let cardTitle = document.createElement('h3')
    cardTitle.textContent = serie.Title
    card.appendChild(cardTitle)
    if (serie.Alt !== '') {
      let cardAlt = document.createElement('h5')
      cardAlt.textContent = serie.Alt
      card.appendChild(cardAlt)
    }
    let cardSlug = document.createElement('tt')
    cardSlug.textContent = '[' + serie.Slug + ']'
    card.appendChild(cardSlug)
    let cardAction = document.createElement('button')
    cardAction.type = 'button'
    cardAction.textContent = 'Episodes list'
    cardAction.addEventListener('click', (e) => {
      let dialogLoader = loadingAlert('Loading episodes list for ' + serie.Title + '…')
      fetch('/detail/' + serie.Slug).then(r => r.json()).then((eps) => {
        dialogLoader.parentNode.removeChild(dialogLoader)
        let dialog = document.createElement('div')
        dialog.classList.add('dialog')
        let closeButton = document.createElement('button')
        closeButton.classList.add('close')
        closeButton.type = 'button'
        closeButton.textContent = 'Close'
        closeButton.addEventListener('click', () => {
          dialog.parentNode.removeChild(dialog)
        })
        dialog.appendChild(closeButton)
        let dialogTitle = document.createElement('h3')
        dialogTitle.textContent = serie.Title
        dialog.appendChild(dialogTitle)
        eps.forEach((ep) => {
          let episodeButton = document.createElement('button')
          episodeButton.type = 'button'
          episodeButton.textContent = 'Episode ' + ep.Number
          episodeButton.addEventListener('click', () => {
            let dialogLoader = loadingAlert('Requesting playback of ' + serie.Title + ' e' + ep.Number + '…')
            fetch('/play/' + serie.Slug + '/' + ep.Number).then((pr) => {
              dialogLoader.parentNode.removeChild(dialogLoader)
              switch (pr.status) {
                case 200:
                  quickAlert(serie.Title + ' ' + ep.Number + ': Added to queue')
                  break
                case 429:
                  quickAlert('Queue is full')
                  break
                default:
                  console.log(pr)
              }
            })
          })
          dialog.appendChild(episodeButton)
        })
        dialogOverlay.appendChild(dialog)
      })
    })
    card.appendChild(cardAction)
    seriesList.appendChild(card)
  })
})
document.addEventListener('keyup', (evt) => {
  switch (evt.key) {
    case 'Escape':
      if (dialogOverlay.children.length > 2) {
        dialogOverlay.removeChild(dialogOverlay.lastElementChild)
      }
      break
  }
})
