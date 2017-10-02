package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"os/exec"
	"strings"
)

var queue chan string

func animeList(w http.ResponseWriter, r *http.Request) {
	log.Print("anime list requested")
	seriesPage, err := FetchPageContents(UrlPseudoJoin("/"))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		log.Print(err)
		return
	}
	series, err := ExtractSeriesList(seriesPage)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		log.Print(err)
		return
	}
	h := w.Header()
	h.Add("Content-Type", "application/json")
	j, _ := json.Marshal(series)
	w.Write(j)
	log.Print("anime list request fulfilled")
}

func animeDetail(w http.ResponseWriter, r *http.Request) {
	pathSplit := strings.Split(r.URL.Path, "/")
	if len(pathSplit[2]) < 1 {
		http.Error(w, "you must specify animeme", http.StatusBadRequest)
		log.Print("episodes list requested for unspecified anime")
		return
	}
	log.Printf("episodes list requested for %v", pathSplit[2])
	episodesPage, err := FetchPageContents(UrlPseudoJoin("/a/" + pathSplit[2]))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		log.Print(err)
		return
	}
	episodes, err := ExtractEpisodesList(episodesPage)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		log.Print(err)
		return
	}
	h := w.Header()
	h.Add("Content-Type", "application/json")
	j, _ := json.Marshal(episodes)
	w.Write(j)
	log.Printf("episodes list for %v fulfilled", pathSplit[2])
}

func enqueue(url string) bool {
	select {
	case queue <- url:
		log.Print("enqueued:", url)
		return true
	default:
		return false
	}
}

func externPlay(w http.ResponseWriter, r *http.Request) {
	url := r.FormValue("url")
	if len(url) <3 {
		http.Error(w, "you must specify url parameter", http.StatusBadRequest)
		log.Print("extern request without url")
		return
	}
	h := w.Header()
	h.Add("Content-Type", "application/json")
	if !enqueue(url) {
		http.Error(w, "queue full", http.StatusTooManyRequests)
		log.Print("queue full for", url)
		return
	}
	w.Write([]byte("{}"))
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
	url := UrlPseudoJoin("/a/" + r.URL.Path[len("/play/"):])
	if !enqueue(url) {
		http.Error(w, "queue full", http.StatusTooManyRequests)
		log.Print("queue full for", url)
		return
	}
	w.Write([]byte("{}"))
}

func handleQueue() {
	for {
		url := <-queue
		log.Print("extracting url from ", url, " for omx")
		vvurl, err := exec.Command("youtube-dl", "-g", url).Output()
		var vurl string
		if err != nil {
			vurl = url
			log.Print("extraction unsuccessful, trying default")
		} else {
			vurl = strings.TrimSpace(string(vvurl))
			log.Print("extraction result: ", vurl)
		}
		log.Print("starting to play")
		omx := exec.Command("omxplayer", vurl)
		omx.Stdout = os.Stderr
		omx.Stdin = os.Stdin
		omx.Stderr = os.Stderr
		if omx.Run() != nil {
			exec.Command("mpv", "-v", "--fs", url).Run()
		}
		log.Print("playback finished")
	}
}

func main() {
	queue = make(chan string, 100)
	go handleQueue()
	http.HandleFunc("/list", animeList)
	http.HandleFunc("/detail/", animeDetail)
	http.HandleFunc("/play/", animePlay)
	http.HandleFunc("/extern/", externPlay)
	http.Handle("/", http.FileServer(http.Dir("static")))
	log.Print("launching")
	http.ListenAndServe(":3000", nil)
}
