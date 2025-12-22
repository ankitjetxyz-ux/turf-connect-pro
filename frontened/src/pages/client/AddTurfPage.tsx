import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";

const AddTurfPage = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    location: "",
    description: "",
    price_per_slot: "",
    facilities: "",
    images: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await api.post("/turfs", {
        ...form,
        price_per_slot: Number(form.price_per_slot),
      });

      alert("Turf added successfully");
      navigate("/client/dashboard");
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to add turf");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-12">
        <div className="container max-w-xl px-4">
          <Card>
            <CardHeader>
              <CardTitle>Add New Turf</CardTitle>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input name="name" placeholder="Turf Name" onChange={handleChange} className="w-full border p-2 rounded" />
                <input name="location" placeholder="Location" onChange={handleChange} className="w-full border p-2 rounded" />
                <textarea name="description" placeholder="Description" onChange={handleChange} className="w-full border p-2 rounded" />
                <input name="price_per_slot" placeholder="Price per slot" onChange={handleChange} className="w-full border p-2 rounded" />
                <input name="facilities" placeholder="Facilities (comma separated)" onChange={handleChange} className="w-full border p-2 rounded" />
                <input name="images" placeholder="Image URLs (comma separated)" onChange={handleChange} className="w-full border p-2 rounded" />

                <Button type="submit" className="w-full">
                  Create Turf
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AddTurfPage;
