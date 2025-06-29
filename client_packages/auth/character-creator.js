let characterBrowser = null;

function submitCharacter() {
  const characterData = {
    gender: parseInt(document.getElementById('gender').value),
    hair: parseInt(document.getElementById('hair').value),
    hairColor1: parseInt(document.getElementById('hairColor1').value),
    hairColor2: 0,
    mother: 21,
    father: 0,
    resemblance: 0.5,
    skinTone: 0.5,
    eyes: 0
  };
  
  mp.trigger('saveCharacter', JSON.stringify(characterData));
}

// Export submitCharacter if needed by character.html
window.submitCharacter = submitCharacter;
