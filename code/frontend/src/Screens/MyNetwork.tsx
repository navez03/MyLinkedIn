import { useState } from "react";
import { Card } from "../components/card";
import { Button } from "../components/button";
import { Users, UserPlus } from "lucide-react";
import Navigation from "../components/header";


const connections = [
  { name: "Ana Silva", role: "Product Manager", mutual: 12, connected: true },
  { name: "Carlos Santos", role: "UX Designer", mutual: 8, connected: true },
  { name: "Maria Oliveira", role: "Tech Lead", mutual: 15, connected: true },
  { name: "João Pedro", role: "Software Engineer", mutual: 20, connected: true },
  { name: "Paula Costa", role: "Data Scientist", mutual: 7, connected: true },
  { name: "Rafael Lima", role: "DevOps Engineer", mutual: 10, connected: true },
];

const suggestions = [
  { name: "Fernanda Souza", role: "Frontend Developer", mutual: 5, connected: false },
  { name: "Lucas Martins", role: "Backend Developer", mutual: 9, connected: false },
  { name: "Julia Almeida", role: "Product Designer", mutual: 6, connected: false },
  { name: "Pedro Henrique", role: "Scrum Master", mutual: 11, connected: false },
];

const Network = () => {
  const [activeSection, setActiveSection] = useState<'connections' | 'invites'>('connections');

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-[1128px] mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-3">
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Gerenciar minha rede</h3>
              <div className="space-y-3">
                <button
                  onClick={() => setActiveSection('connections')}
                  className={`w-full flex items-center justify-between py-2 hover:bg-secondary rounded px-2 transition-colors ${activeSection === 'connections' ? 'bg-secondary' : ''
                    }`}
                >
                  <span className="text-sm">Conexões</span>
                  <span className="text-sm font-semibold text-muted-foreground">{connections.length}</span>
                </button>
                <button
                  onClick={() => setActiveSection('invites')}
                  className={`w-full flex items-center justify-between py-2 hover:bg-secondary rounded px-2 transition-colors ${activeSection === 'invites' ? 'bg-secondary' : ''
                    }`}
                >
                  <span className="text-sm">Convites</span>
                  <span className="text-sm font-semibold text-muted-foreground">{suggestions.length}</span>
                </button>
              </div>
            </Card>
          </div>

          <div className="col-span-12 lg:col-span-9 space-y-4">
            {activeSection === 'invites' && (
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <UserPlus className="w-5 h-5" />
                  <h2 className="text-xl font-semibold">Convites para conectar</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {suggestions.map((person) => (
                    <div key={person.name} className="flex gap-3 p-4 border border-border rounded-lg">

                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{person.name}</h3>
                        <p className="text-sm text-muted-foreground mb-2 truncate">{person.role}</p>
                        <p className="text-xs text-muted-foreground mb-3">
                          {person.mutual} conexões em comum
                        </p>
                        <div className="flex gap-2">
                          <Button size="sm" className="flex-1">Conectar</Button>
                          <Button size="sm" variant="outline" className="flex-1">Ignorar</Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {activeSection === 'connections' && (
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5" />
                  <h2 className="text-xl font-semibold">Minhas conexões</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {connections.map((person) => (
                    <div key={person.name} className="flex gap-3 p-4 border border-border rounded-lg hover:bg-secondary transition-colors cursor-pointer">

                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{person.name}</h3>
                        <p className="text-sm text-muted-foreground mb-2 truncate">{person.role}</p>
                        <p className="text-xs text-muted-foreground mb-3">
                          {person.mutual} conexões em comum
                        </p>
                        <Button size="sm" variant="outline" className="w-full">Enviar mensagem</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Network;
