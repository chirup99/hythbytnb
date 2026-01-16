import sys

filepath = 'client/src/pages/home.tsx'
with open(filepath, 'r') as f:
    content = f.read()

# Markers for the voice selection area
start_anchor = 'gap-4 overflow-x-auto no-scrollbar py-2">'
end_anchor = 'Select a voice for your minicast'

start_pos = content.find(start_anchor)
if start_pos == -1:
    print("Start anchor not found")
    sys.exit(1)

start_pos += len(start_anchor)

end_pos = content.find(end_anchor, start_pos)
if end_pos == -1:
    print("End anchor not found")
    sys.exit(1)

# Backtrack to the last </div> before the end anchor
end_pos = content.rfind('</div>', start_pos, end_pos)
if end_pos == -1:
    print("Closing div not found")
    sys.exit(1)
end_pos += 6

prefix = content[:start_pos]
suffix = content[end_pos:]

# The clean, correct JSX block
middle = """
                                      {[
                                        { id: "samantha", name: "Samantha", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Samantha" },
                                        { id: "amro", name: "Amro", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" },
                                        { id: "heera", name: "Heera", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka" },
                                        { id: "add", name: "Add", isAdd: true }
                                      ].map((profile) => {
                                        const isSelected = typeof activeVoiceProfileId !== "undefined" && activeVoiceProfileId === profile.id;
                                        return (
                                          <div 
                                            key={profile.id} 
                                            className="flex flex-col items-center gap-1.5 group cursor-pointer" 
                                            onClick={() => {
                                              if (!profile.isAdd) {
                                                setActiveVoiceProfileId(profile.id);
                                                if (typeof window !== "undefined" && "speechSynthesis" in window) {
                                                  // Stop current playback
                                                  window.speechSynthesis.cancel();

                                                  const name = currentUser?.displayName || currentUser?.username || "Trader";
                                                  const utterance = new SpeechSynthesisUtterance(`Hello ${name}, I am ${profile.name}. How is your day? Welcome to perala!`);
                                                  const voices = window.speechSynthesis.getVoices();
                                                  
                                                  // Find profile-specific voices
                                                  let voice = null;
                                                  if (profile.id === "samantha") {
                                                    voice = voices.find(v => v.name.includes("Samantha") || v.name.includes("Zira") || (v.name.includes("Female") && v.lang.includes("en-US")));
                                                  } else if (profile.id === "amro") {
                                                    voice = voices.find(v => v.name.includes("Male") || v.name.includes("David") || v.name.includes("Google UK English Male"));
                                                  } else if (profile.id === "heera") {
                                                    voice = voices.find(v => v.name.includes("Hindi") || v.name.includes("Indian") || (v.name.includes("Female") && v.lang.includes("en-GB")));
                                                  }
                                                  
                                                  if (voice) utterance.voice = voice;
                                                  window.speechSynthesis.speak(utterance);
                                                }
                                              }
                                            }}
                                          >
                                            <div className={`relative w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all group-hover:scale-105 ${isSelected ? "border-blue-500 ring-2 ring-blue-500/50" : "border-transparent"} active:scale-95 overflow-hidden bg-gray-700 shadow-lg`}>
                                              {profile.isAdd ? (
                                                <Plus className="h-5 w-5 text-gray-400" />
                                              ) : (
                                                <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
                                              )}
                                            </div>
                                            <span className={`text-[10px] font-medium transition-colors flex items-center gap-1 ${isSelected ? "text-blue-400 font-bold" : "text-gray-300 group-hover:text-blue-400"}`}>
                                              {profile.name} {isSelected && <Check className="h-2.5 w-2.5" />}
                                            </span>
                                          </div>
                                        );
                                      })}
                                    </div>"""

with open(filepath, 'w') as f:
    f.write(prefix + middle + suffix)
print("Successfully patched")
