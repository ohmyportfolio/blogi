import { createProduct } from "@/actions/product";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function NewProductPage() {
    return (
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow">
            <h1 className="text-2xl font-bold mb-6">Add New Product</h1>
            <form action={createProduct} className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input id="title" name="title" required placeholder="Product Name" />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <select
                        id="category"
                        name="category"
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                        required
                    >
                        <option value="">Select Category</option>
                        <option value="CASINO">Casino</option>
                        <option value="NIGHTLIFE">Night Life</option>
                        <option value="PROMOTION">Promotion</option>
                        <option value="VIP_TRIP">VIP Trip</option>
                        <option value="TIP">Travel Tip</option>
                        <option value="HOTEL_VILLA">Hotel & Pool Villa</option>
                        <option value="GOLF">Golf & Leisure</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="price">Price (Optional)</Label>
                    <Input id="price" name="price" placeholder="e.g. $100 or Contact Us" />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="imageUrl">Image URL (Optional)</Label>
                    <Input id="imageUrl" name="imageUrl" placeholder="https://example.com/image.jpg" />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="content">Content (HTML/Markdown)</Label>
                    <Textarea
                        id="content"
                        name="content"
                        required
                        placeholder="Product details..."
                        className="min-h-[200px]"
                    />
                </div>

                <Button type="submit" className="w-full">Create Product</Button>
            </form>
        </div>
    );
}
