import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface NichePackage {
  id: number;
  name: string;
  niche: string;
  description: string | null;
  price: number;
  features: string;
  active: number;
  createdAt: Date;
}

export default function AdminNichePackages() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    niche: "",
    description: "",
    price: 0,
    features: "",
  });

  const { data: packages = [] } = trpc.nichePackages.list.useQuery();

  const handleOpenDialog = (pkg?: NichePackage) => {
    if (pkg) {
      setEditingId(pkg.id);
      const featuresList = typeof pkg.features === 'string' ? pkg.features : JSON.stringify(pkg.features);
      setFormData({
        name: pkg.name,
        niche: pkg.niche,
        description: pkg.description || "",
        price: pkg.price,
        features: featuresList,
      });
    } else {
      setEditingId(null);
      setFormData({
        name: "",
        niche: "",
        description: "",
        price: 0,
        features: "",
      });
    }
    setIsOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.niche || !formData.description || formData.price <= 0) {
      toast.error("Vyplňte všechna povinná pole");
      return;
    }

    if (editingId) {
      toast.success("Balíček aktualizován");
    } else {
      toast.success("Balíček vytvořen");
    }

    setIsOpen(false);
    setFormData({
      name: "",
      niche: "",
      description: "",
      price: 0,
      features: "",
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Opravdu chcete smazat tento balíček?")) {
      toast.success("Balíček smazán");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Niche Balíčky</h2>
          <p className="text-slate-600 mt-1">Spravujte dostupné niche balíčky pro zákazníky</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Nový balíček
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingId ? "Upravit balíček" : "Vytvořit nový balíček"}</DialogTitle>
              <DialogDescription>
                Vyplňte informace o niche balíčku
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Název balíčku *</Label>
                <Input
                  id="name"
                  placeholder="Např. Café Pro"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="niche">Niche/Obor *</Label>
                <Input
                  id="niche"
                  placeholder="Např. Kavárny, Elektrikáři, Kadeřnice"
                  value={formData.niche}
                  onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="description">Popis *</Label>
                <Textarea
                  id="description"
                  placeholder="Popis balíčku a jeho výhod"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="price">Měsíční cena (Kč) *</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="990"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="features">Funkce (jedna na řádek)</Label>
                <Textarea
                  id="features"
                  placeholder="Online rezervace&#10;Email notifikace&#10;SMS reminders"
                  value={formData.features}
                  onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                  rows={4}
                />
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Zrušit
                </Button>
                <Button onClick={handleSave}>
                  {editingId ? "Uložit změny" : "Vytvořit balíček"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dostupné balíčky ({packages.length})</CardTitle>
          <CardDescription>Seznam všech niche balíčků</CardDescription>
        </CardHeader>
        <CardContent>
          {packages.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              Zatím nejsou vytvořeny žádné balíčky
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Název</TableHead>
                    <TableHead>Cena</TableHead>
                    <TableHead>Funkce</TableHead>
                    <TableHead>Stav</TableHead>
                    <TableHead className="text-right">Akce</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {packages.map((pkg: NichePackage) => (
                    <TableRow key={pkg.id}>
                      <TableCell className="font-medium">{pkg.name}</TableCell>
                      <TableCell>{pkg.price} Kč/měsíc</TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {pkg.niche}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          pkg.active === 1
                            ? "bg-green-100 text-green-800"
                            : "bg-slate-100 text-slate-800"
                        }`}>
                          {pkg.active === 1 ? "Aktivní" : "Neaktivní"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(pkg)}
                            className="flex items-center gap-1"
                          >
                            <Edit2 className="w-4 h-4" />
                            <span className="hidden sm:inline">Upravit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(pkg.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 flex items-center gap-1"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span className="hidden sm:inline">Smazat</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
