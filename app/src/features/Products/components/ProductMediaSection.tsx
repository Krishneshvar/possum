import { useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, Image as ImageIcon } from "lucide-react";

interface ProductMediaSectionProps {
    imageUrl: string | null;
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleRemoveImage: () => void;
}

export default function ProductMediaSection({
    imageUrl,
    handleFileChange,
    handleRemoveImage,
}: ProductMediaSectionProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        return () => {
            if (imageUrl && imageUrl.startsWith('blob:')) {
                URL.revokeObjectURL(imageUrl);
            }
        };
    }, [imageUrl]);

    const handleButtonClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    return (
        <Card className="overflow-hidden">
            <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <ImageIcon className="h-5 w-5 text-primary" />
                    Product Image
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col space-y-4">
                    <div
                        className={`
              relative flex flex-col justify-center items-center 
              border-2 border-dashed rounded-lg 
              transition-colors duration-200 ease-in-out
              ${imageUrl ? 'border-primary/20 bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'}
              min-h-[200px]
            `}
                    >
                        {imageUrl ? (
                            <>
                                <div className="absolute top-2 right-2 z-10">
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        onClick={handleRemoveImage}
                                        className="h-8 w-8 rounded-full shadow-sm hover:scale-105 transition-transform"
                                        title="Remove image"
                                        aria-label="Remove image"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                                <img
                                    src={imageUrl}
                                    alt="Product preview"
                                    className="w-full h-full object-contain max-h-[250px] rounded-md p-2"
                                />
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
                                <div className="p-3 bg-muted rounded-full">
                                    <Upload className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium">Click to upload image</p>
                                    <p className="text-xs text-muted-foreground">
                                        SVG, PNG, JPG or GIF (max. 2MB)
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    type="button"
                                    onClick={handleButtonClick}
                                >
                                    Select File
                                </Button>
                            </div>
                        )}
                        <Input
                            ref={fileInputRef}
                            id="image-upload"
                            name="image"
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
