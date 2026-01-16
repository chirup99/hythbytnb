import sys

filepath = 'client/src/pages/home.tsx'
with open(filepath, 'r') as f:
    content = f.read()

# Markers are now likely corrupted, let's use a very broad search for the voices section
start_marker = 'id: "samantha"'
end_marker = 'Select a voice for your minicast'

# Find the start of the array containing Samantha
start_pos = content.find(start_marker)
if start_pos != -1:
    # Backtrack to the opening square bracket
    while start_pos > 0 and content[start_pos] != '[':
        start_pos -= 1
        
    # Find the end of the map/div section
    end_pos = content.find(end_marker, start_pos)
    if end_pos != -1:
        # Backtrack to find the closing div of the map container
        # We'll just look for the first </div> before the end_marker
        end_pos = content.rfind('</div>', start_pos, end_pos) + 6
        
        prefix = content[:start_pos]
        suffix = content[end_pos:]
        
        middle = """[
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
                                                  // Stop current speech before starting new one
                                                  window.speechSynthesis.cancel();

                                                  const name = currentUser?.displayName || currentUser?.username || "Trader";
                                                  const utterance = new SpeechSynthesisUtterance("Hello " + name + ", I am " + profile.name + ". How is your day? Welcome to perala!");
                                                  const voices = window.speechSynthesis.getVoices();
                                                  if (profile.id === "samantha" || profile.name.toLowerCase().includes("samantha")) {
                                                    const v = voices.find(v => v.name.includes("Samantha") || v.name.includes("Female") || v.name.includes("Google US English"));
                                                    if (v) utterance.voice = v;
                                                  } else if (profile.id === "amro" || profile.name.toLowerCase().includes("amro")) {
                                                    const v = voices.find(v => v.name.includes("Male") || v.name.includes("Google UK English Male") || v.name.includes("Microsoft David"));
                                                    if (v) utterance.voice = v;
                                                  } else if (profile.id === "heera" || profile.name.toLowerCase().includes("heera")) {
                                                    const v = voices.find(v => v.name.includes("Google Hindi") || v.name.includes("Indian") || v.name.includes("Female"));
                                                    if (v) utterance.voice = v;
                                                  }
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
                                      })
                                    </div>"""
        with open(filepath, 'w') as f:
            f.write(prefix + middle + suffix)
        print("Success")
    else:
        print("End marker not found")
        sys.exit(1)
else:
    print("Start marker not found")
    sys.exit(1)
