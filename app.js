/* =================== */
/* GET DATA */
/* =================== */

// Reference : https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Objects/JSON
// Request : https://datarmor.cotesdarmor.fr/datasets/arbres-remarquables-des-cotes-d'armor/api-doc

/*
Call The API an return the remarquable trees of Côtes-d'Armor
*/


// variables globales pour eviter les problemes
let map
let markerAbre


async function getTrees() {
    const requestURL =
        "https://datarmor.cotesdarmor.fr/data-fair/api/v1/datasets/arbres-remarquables-des-cotes-d'armor/lines?size=1000&q=typearbre=remarquable"; // Fournir l'url
    const request = new Request(requestURL)

    const response = await fetch(request)
    const respJSON = await response.json() // Fournir la fonction jusque-là ?

    const trees = respJSON.results

    return trees
}

/* The trees from the API */
const TREES = await getTrees()


console.log(TREES)

/* fonction qui affiche la carte */
function printMap() {
    map = L.map('map', {
        center: [48.6, -2.8],   // donné dans le sujet
        zoom: 8.5               // donné dans le sujet
    })
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map)
}



/* création de la case avec l'arbre de base */
const h2Class = document.querySelector("h2")
h2Class.innerHTML = "L'arbre du jour"

const treeFocusClass = document.querySelector(".tree-focus")
const essenceClass = document.createElement("h3")
const communeClass = document.createElement("h4")
const circonferenceClass = document.createElement("p")
const envergureClass = document.createElement("p")

/* pour avoir un arbre random à chaque refresh */
function getRandomInt(min, max) {
    min = Math.ceil(min)
    max = Math.floor(max)
    return Math.floor(Math.random() * (max - min)) + min
}
let random = getRandomInt(0, 88)

essenceClass.innerText = TREES[random].Essence
communeClass.innerText = "à " + (TREES[random].Commune ?? "Information non disponible")
circonferenceClass.innerText = TREES[random].Dimensioncirconference ? "Circonférence : " + TREES[random].Dimensioncirconference : "Circonférence : Pas d'information"
envergureClass.innerText = TREES[random].dimensionenvergure ? "Envergure : " + TREES[random].dimensionenvergure : "Envergure : Pas d'information"
treeFocusClass.append(essenceClass, communeClass, circonferenceClass, envergureClass)



/* fonction qui affiche les informations à gauche */
function printTreeInformations(tree) {
    /* console.log("Arbre reçu :", tree) */
    
    treeFocusClass.innerHTML = '' // effacer le précédent

    if (tree && tree.Essence) { // si les deux existent
        const newEssenceClass = document.createElement("h3")
        const newCommuneClass = document.createElement("h4")
        const newCirconferenceClass = document.createElement("p")
        const newEnvergureClass = document.createElement("p")

        newEssenceClass.innerText = tree.Essence
        newCommuneClass.innerText = "à " + (tree.Commune ?? "Information non disponible")
        newCirconferenceClass.innerText = tree.Dimensioncirconference ? "Circonférence : " + tree.Dimensioncirconference : "Circonférence : Pas d'information"
        newEnvergureClass.innerText = tree.dimensionenvergure ? "Envergure : " + tree.dimensionenvergure : "Envergure : Pas d'information"

        treeFocusClass.append(newEssenceClass, newCommuneClass, newCirconferenceClass, newEnvergureClass)
    } else {
        console.log("L'arbre n'est pas défini ou la propriété Essence n'est pas définie.")
    }
}



let numTrees = TREES.length

function printTree(TREES) {
    // effacer tous les marqueurs existants
    allMarkers.forEach(marker => map.removeLayer(marker));
    allMarkers = []; // réinitialiser la liste des marqueurs

    let treeIcon = L.icon({
        iconUrl: './images/marker.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
    })

    // pour chaque arbre
    TREES.forEach(tree => {
        if (tree["_geopoint"]) {
            const loc = tree["_geopoint"].split(',')
            const lat = parseFloat(loc[0]) // transformer le string en float
            const lon = parseFloat(loc[1]) // transformer le string en float

            // pop-up additionnel
            const popupContent = tree.Essence + '<br> à ' + tree.Commune + '<br> Circonférence : ' + (tree.Dimensioncirconference ?? "Pas d'information") + '<br> Envergure : ' + (tree.dimensionenvergure ?? "Pas d'information")

            // création du marqueur avec l'essence associée
            const marker = L.marker([lat, lon], { icon: treeIcon }).addTo(map)
                .bindPopup(popupContent)

            // attribution de l'essence à la propriété treeEssence du marqueur
            marker.options.treeEssence = tree.Essence.toLowerCase()

            // gestion du clique
            marker.addEventListener("click", (e) => {
                printTreeInformations(tree) // appel de la fonction qui affiche les informations
            })

            // ajout du marqueur à la liste des marqueurs
            allMarkers.push(marker)
        } else {
            console.log("Pas de geopoint pour cet arbre")
        }
    })
}


// fonction qui change la latitude et longitude du marker pour bien afficher le popup
function updateMarker(tree) {
    if (markerAbre) {
        markerAbre.remove() // supprimer le marqueur s'il y en a un
    }

    const loc = tree["_geopoint"].split(",")
    const lat = parseFloat(loc[0])
    const lon = parseFloat(loc[1])

    const treeIcon = L.icon({
        iconUrl: './images/marker.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
    })

    markerAbre = L.marker([lat, lon], { icon: treeIcon }).addTo(map)

    markerAbre.bindPopup(
        tree.Essence + '<br> à ' + (tree.Commune ?? "Information non disponible") + '<br> Circonférence : ' + (tree.Dimensioncirconference ?? "Pas d'information") + '<br> Envergure : ' + (tree.dimensionenvergure ?? "Pas d'information")
    ).openPopup()
}




let index = 0 // initialisé à 0 au début

function changeTree() {
    const arrowLeftClass = document.querySelector(".arrow-left")
    const arrowRightClass = document.querySelector(".arrow-right")


    arrowLeftClass.addEventListener("click", (e) =>{
        index = (index - 1 + numTrees) % numTrees // actuel index - 1 + plus le nombre d'arbres modulo le nombre d'arbre
        printTreeInformations(TREES[index])

        // ré-afficher tous les markers au cas ou on avait trié avant
        printTree(TREES)

        updateMarker(TREES[index])
    })
    arrowRightClass.addEventListener("click", (e) =>{
        index = (index + 1 + numTrees) % numTrees
        printTreeInformations(TREES[index])

        // ré-afficher tous les markers au cas ou on avait trié avant
        printTree(TREES)

        updateMarker(TREES[index])
    })
}
 
changeTree() // le faire une fois dans le vide pour pas de bug

document.querySelector('.arrow-left').addEventListener('click', function() {
    changeTree(TREES)
})
document.querySelector('.arrow-right').addEventListener('click', function() {
    changeTree(TREES)
})


// fonction qui récupère toutes les essences
function getAllEssence(TREES) {
    const tabEssence = []
    TREES.forEach(tree => {
        if (!tabEssence.includes(tree.Essence)) {
            tabEssence.push(tree.Essence)
        }
    })
    return tabEssence
}
// fonction qui affiche toutes les essences dans le select
function printAllEssence(tabEssence) {
    let selectClass = document.querySelector('.select')
    tabEssence.forEach(essence => {
        let essenceClass = document.createElement("option")
        essenceClass.value = essence
        essenceClass.textContent = essence
        selectClass.appendChild(essenceClass)
    })
}


// tableau de tous les marqueurs ajoutés à la carte
let allMarkers = []

// lorsqu'on ajoute un marqueur à la carte, on l'ajoute également à la liste allMarkers
function addMarkerToMap(lat, lng, popupContent) {
    const marker = L.marker([lat, lng]).addTo(map)
    marker.bindPopup(popupContent)
    allMarkers.push(marker)
}

document.querySelector('.select').addEventListener('change', (event) => {
    const selectedEssence = event.target.value.toLowerCase()

    allMarkers.forEach(marker => {
        const treeEssence = marker.options.treeEssence.toLowerCase() 

        if (!selectedEssence || treeEssence === selectedEssence) {
            marker.addTo(map)
        } else {
            map.removeLayer(marker)
        }
    })
})



printMap()
printTree(TREES)

const essences = getAllEssence(TREES)
printAllEssence(essences)