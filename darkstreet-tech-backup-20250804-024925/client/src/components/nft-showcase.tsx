import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NFTShowcase() {
  const nftItems = [
    {
      id: 1,
      title: "Neural Networks",
      description: "AI-powered data visualization and pattern recognition systems.",
      image: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&h=600",
      gradient: "from-neon-green to-neon-cyan",
    },
    {
      id: 2,
      title: "Quantum Computing",
      description: "Next-generation computational power for complex problem solving.",
      image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&h=600",
      gradient: "from-purple-500 to-neon-cyan",
    },
    {
      id: 3,
      title: "Machine Learning",
      description: "Advanced algorithms that learn and adapt to optimize performance.",
      image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&h=600",
      gradient: "from-neon-green to-yellow-400",
    },
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-black to-dark-gray">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Digital Art <span className="text-neon-green">Meets</span> Technology
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Explore our collection of AI-generated NFT-style artwork that represents 
            the fusion of creativity and technology.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {nftItems.map((item) => (
            <Card 
              key={item.id}
              className="bg-dark-gray rounded-xl border border-neon-green/20 hover:border-neon-green/60 transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,255,136,0.3)] group overflow-hidden"
            >
              <div className="relative">
                <img 
                  src={item.image}
                  alt={item.title}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${item.gradient} opacity-20 group-hover:opacity-30 transition-opacity duration-300`}></div>
              </div>
              <CardHeader className="pb-3">
                <CardTitle className="text-xl font-semibold text-neon-green">
                  {item.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 text-sm">
                  {item.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
