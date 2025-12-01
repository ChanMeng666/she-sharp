import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Card, CardContent } from "@/components/ui/card";

const testimonials = [
  {
    name: "Shein Delos Angeles",
    role: "Event Volunteer",
    quote: "I volunteered to help with the She Sharp Tomorrow Expo and I enjoyed every step of the way. I was one of the volunteers who helped set up and talk to people about She Sharp's agenda and it was a blast! I wanted to commend this organisation for giving me an opportunity to meet people around tech and to know some people that are now my friends. I'm looking forward to the next upcoming event!"
  },
  {
    name: "Vic Arce",
    role: "Previous Ambassador",
    quote: "Working with She# has been such a remarkable experience. I feel lucky to have had the opportunity to be surrounded by highly motivated people who want to make a difference for women. I once spoke with a friend who described the She# team as people who eat passion for breakfast - a very amusing description which I found true in the months I've been with the team."
  },
  {
    name: "Aneela Lala",
    role: "Previous Ambassador",
    quote: "As an Ambassador for She Sharp, I have had the privilege of collaborating with fabulous like-minded Wahine, connecting with amazing people from diverse STEM fields and sharing my passion for STEM and inclusivity with so many talented, successful and inspiring Women in Industry. In addition, She Sharp has allowed me to step outside of my comfort zone (as an introvert), by providing a supportive safety net of Ambassadors who challenge my own limiting beliefs about my capabilities and encourage me to grow."
  },
  {
    name: "Yinghui (Maxie) Ouyang",
    role: "Event Volunteer",
    quote: "Being a volunteer at She Sharp has been an enlightening and fulfilling experience. The She Sharp team really take care of you and make sure you get access to the benefits as if you are a participant of each event. Networking is a great example of that. I've met more women in tech from the first event than I have in months. They go out of their way to make sure the volunteers are seen and appreciated for their hard work."
  }
];

export function TestimonialsSection() {
  return (
    <Section className="py-16 bg-gray-50">
      <Container>
        <h2 className="text-3xl font-bold text-foreground text-center mb-12">
          Here&apos;s what people say about She Sharp
        </h2>
        <div className="grid md:grid-cols-2 gap-8">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.name}>
              <CardContent className="p-6">
                <blockquote className="text-gray-700 mb-4">
                  &ldquo;{testimonial.quote}&rdquo;
                </blockquote>
                <div>
                  <p className="font-semibold text-foreground">{testimonial.name}</p>
                  <p className="text-sm text-gray-600">{testimonial.role}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </Container>
    </Section>
  );
}