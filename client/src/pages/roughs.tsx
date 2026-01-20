import { Card, CardContent, CardHeader, Dialog, DialogContent, DialogTrigger } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { ScrollArea } from "@/components/ui/scroll-area";

const drawings = [
  "/attached_assets/image_1768909107618.png",
  "/attached_assets/image_1768920097940.png",
  "/attached_assets/image_1768907234010.png",
  "/attached_assets/image_1768907412539.png",
  "/attached_assets/targeted_element_1768844231122.png"
];

export default function RoughsPage() {
  return (
    <div className="p-6 bg-gray-900 min-h-screen text-gray-100">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trading Roughs</h1>
          <p className="text-gray-400 mt-2">Latest pencil drawings and technical drafts.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {drawings.map((src, index) => (
            <Card key={index} className="bg-gray-800 border-gray-700 overflow-hidden hover:ring-2 hover:ring-indigo-500 transition-all cursor-pointer">
              <Dialog>
                <DialogTrigger asChild>
                  <div>
                    <AspectRatio ratio={4 / 3}>
                      <img 
                        src={src} 
                        alt={`Rough ${index + 1}`}
                        className="object-cover w-full h-full"
                      />
                    </AspectRatio>
                  </div>
                </DialogTrigger>
                <DialogContent className="max-w-4xl bg-gray-900 border-gray-800 p-0 overflow-hidden">
                  <div className="p-1">
                    <img 
                      src={src} 
                      alt={`Rough ${index + 1}`}
                      className="w-full h-auto"
                    />
                  </div>
                </DialogContent>
              </Dialog>
              <CardHeader className="p-4">
                <h3 className="text-sm font-medium text-gray-200">Draft #{index + 1}</h3>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
