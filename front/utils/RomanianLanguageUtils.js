// export function sortByPath = (list, path) => list.sort((a,b) => (a.attributes.tag > b.attributes.tag) ? 1 : ((b.attributes.tag > a.attributes.tag) ? -1 : 0))

export default class RomanianUtils {
  // Speech to text sometimes types numbers as words... This
  static numberDictionary = {
    // Slang ones
    unu: '1',
    doi: '2',
    trei: '3',
    patru: '4',
    cinci: '5',
    sase: '6',
    sapte: '7',
    opt: '8',
    noua: '9',
    zece: '10',
    unspe: '11',
    doispe: '12',
    treispe: '13',
    paispe: '14',
    cinspe: '15',
    saispe: '16',
    saptispe: '17',
    optispe: '18',
    nouaspe: '19',
    douazeci: '20',
    douasunu: '21',
    douasdoi: '22',
    douastrei: '23',
    douaspatru: '24',
    douascinici: '25',
    douassase: '26',
    douassapte: '27',
    douasopt: '28',
    douasnoua: '29',
    treizeci: '30',
    treisunu: '31',
    treisdoi: '32',
    treistrei: '33',
    treispatru: '34',
    treiscinci: '35',
    treissase: '36',
    treissapte: '37',
    treisopt: '38',
    treisnoua: '39',
    patruzeci: '40',
    patrusunu: '41',
    patrusdoi: '42',
    patrustrei: '43',
    patruspatru: '44',
    patruscinci: '45',
    patrussase: '46',
    patrussapte: '47',
    patrusopt: '48',
    patrusnoua: '49',

    // Correct ones...
    douazecisiunu: '21',
    douazecisidoi: '22',
    douazecisitrei: '23',
    douazecisipatru: '24',
    douazecisicinci: '25',
    douazecisisase: '26',
    douazecisisapte: '27',
    douazecisiopt: '28',
    douazecisinuea: '29',
    treizecisidoi: '32',
    treizecisitrei: '33',
    treizecisipatru: '34',
    treizecisicinci: '35',
    treizecisisase: '36',
    treizecisisapte: '37',
    treizecisiopt: '38',
    treizecisinuea: '39',
    patruzecisidoi: '42',
    patruzecisitrei: '43',
    patruzecisipatru: '44',
    patruzecisicinci: '45',
    patruzecisisase: '46',
    patruzecisisapte: '47',
    patruzecisiopt: '48',
    patruzecisinuea: '49',
    cincizeci: '50',
  }

  static fixBadWordNumbers = (text) => {
    if (!text) {
      return ''
    }
    return text
      .split(' ')
      .map((word) => {
        if (word in RomanianUtils.numberDictionary) {
          return RomanianUtils.numberDictionary[word]
        }
        return word
      })
      .join(' ')
  }
}
