package main

import (
	"encoding/json"
	"net/http"
	"os/exec"
	"strings"
)

var queue chan string

func animeList(w http.ResponseWriter, r *http.Request) {
	seriesPage, err := FetchPageContents(UrlPseudoJoin("/"))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	series, err := ExtractSeriesList(seriesPage)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	h := w.Header()
	h.Add("Content-Type", "application/json")
	j, _ := json.Marshal(series)
	w.Write(j)
}

func animeDetail(w http.ResponseWriter, r *http.Request) {
	pathSplit := strings.Split(r.URL.Path, "/")
	if len(pathSplit[2]) < 1 {
		http.Error(w, "you must specify animeme", http.StatusBadRequest)
		return
	}
	episodesPage, err := FetchPageContents(UrlPseudoJoin("/a/" + pathSplit[2]))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	episodes, err := ExtractEpisodesList(episodesPage)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	h := w.Header()
	h.Add("Content-Type", "application/json")
	j, _ := json.Marshal(episodes)
	w.Write(j)
}

func animePlay(w http.ResponseWriter, r *http.Request) {
	pathSplit := strings.Split(r.URL.Path, "/")
	if len(pathSplit) < 4 {
		http.Error(w, "you must specify animeme and episode number", http.StatusBadRequest)
		return
	}
	if len(pathSplit[2]) < 1 {
		http.Error(w, "you must specify animeme", http.StatusBadRequest)
		return
	}
	if len(pathSplit[3]) < 1 {
		http.Error(w, "you must specify episode", http.StatusBadRequest)
		return
	}
	h := w.Header()
	h.Add("Content-Type", "application/json")
	select {
	case queue <- UrlPseudoJoin("/a/" + r.URL.Path[len("/play/"):]):
		w.Write([]byte("{}"))
	default:
		http.Error(w, "queue full", http.StatusTooManyRequests)

	}
}

func handleQueue() {
	for {
		url := <-queue
		exec.Command("mpv", "--fs", url).Run()
	}
}

func main() {
	queue = make(chan string, 10)
	go handleQueue()
	http.HandleFunc("/list", animeList)
	http.HandleFunc("/detail/", animeDetail)
	http.HandleFunc("/play/", animePlay)
	http.Handle("/", http.FileServer(http.Dir("static")))
	http.ListenAndServe(":3000", nil)
}
